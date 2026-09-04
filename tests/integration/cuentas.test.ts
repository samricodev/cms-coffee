import { beforeEach, describe, expect, it } from "vitest";

import { limpiarBase } from "../helpers";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { createSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import {
  authenticate,
  changeOwnPassword,
  createUser,
  resetPassword,
  updateUser,
} from "@/lib/users";
import { eq } from "drizzle-orm";

const CLAVE = "contrasena-de-prueba";
const NUEVA = "otra-contrasena-larga";

async function esperarError(fn: () => Promise<unknown>): Promise<AppError> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("se esperaba un AppError y no se lanzó ninguno");
}

async function alta(role: "admin" | "editor", email: string) {
  return createUser({ email, name: role, password: CLAVE, role });
}

async function sesionesDe(userId: string) {
  return db.select().from(sessions).where(eq(sessions.userId, userId));
}

beforeEach(limpiarBase);

describe("cambiar la propia contraseña", () => {
  it("exige la actual y acepta la nueva", async () => {
    const actor = await alta("editor", "editor@test.local");

    const error = await esperarError(() =>
      changeOwnPassword(actor, { current: "equivocada", next: NUEVA, repeat: NUEVA }),
    );
    expect(error.code).toBe("unauthorized");

    await changeOwnPassword(actor, { current: CLAVE, next: NUEVA, repeat: NUEVA });

    await expect(
      authenticate({ email: actor.email, password: NUEVA }),
    ).resolves.toMatchObject({ id: actor.id });
    expect(
      (await esperarError(() => authenticate({ email: actor.email, password: CLAVE })))
        .code,
    ).toBe("unauthorized");
  });

  it("cierra las demás sesiones y conserva la actual", async () => {
    const actor = await alta("editor", "editor@test.local");

    const actual = await createSession(actor.id);
    await createSession(actor.id);
    await createSession(actor.id);
    expect(await sesionesDe(actor.id)).toHaveLength(3);

    const [enCurso] = await sesionesDe(actor.id).then((filas) =>
      filas.filter((fila) => fila.expiresAt.getTime() === actual.expiresAt.getTime()),
    );

    await changeOwnPassword(
      actor,
      { current: CLAVE, next: NUEVA, repeat: NUEVA },
      enCurso.tokenHash,
    );

    const restantes = await sesionesDe(actor.id);
    expect(restantes).toHaveLength(1);
    expect(restantes[0].tokenHash).toBe(enCurso.tokenHash);
  });
});

describe("reseteo por un administrador", () => {
  it("cambia la clave y cierra TODAS las sesiones del usuario", async () => {
    const admin = await alta("admin", "admin@test.local");
    const editor = await alta("editor", "editor@test.local");

    await createSession(editor.id);
    await createSession(editor.id);

    await resetPassword(admin, editor.id, NUEVA);

    expect(await sesionesDe(editor.id)).toHaveLength(0);
    await expect(
      authenticate({ email: editor.email, password: NUEVA }),
    ).resolves.toBeDefined();
  });
});

describe("activar y desactivar cuentas", () => {
  it("una cuenta desactivada no puede entrar, con el mismo mensaje genérico", async () => {
    const admin = await alta("admin", "admin@test.local");
    const editor = await alta("editor", "editor@test.local");

    await updateUser(admin, editor.id, { active: false });

    const error = await esperarError(() =>
      authenticate({ email: editor.email, password: CLAVE }),
    );
    expect(error.message).toBe("Email o contraseña incorrectos");
  });

  it("desactivar expulsa a quien ya estaba dentro", async () => {
    const admin = await alta("admin", "admin@test.local");
    const editor = await alta("editor", "editor@test.local");
    await createSession(editor.id);

    await updateUser(admin, editor.id, { active: false });

    expect(await sesionesDe(editor.id)).toHaveLength(0);
  });

  it("reactivar permite volver a entrar", async () => {
    const admin = await alta("admin", "admin@test.local");
    const editor = await alta("editor", "editor@test.local");

    await updateUser(admin, editor.id, { active: false });
    await updateUser(admin, editor.id, { active: true });

    await expect(
      authenticate({ email: editor.email, password: CLAVE }),
    ).resolves.toBeDefined();
  });
});

describe("protecciones contra quedarse fuera", () => {
  it("un admin no puede desactivarse a sí mismo", async () => {
    const admin = await alta("admin", "admin@test.local");

    expect(
      (await esperarError(() => updateUser(admin, admin.id, { active: false }))).code,
    ).toBe("forbidden");
  });

  it("un admin no puede cambiarse el rol a sí mismo", async () => {
    const admin = await alta("admin", "admin@test.local");

    expect(
      (await esperarError(() => updateUser(admin, admin.id, { role: "editor" }))).code,
    ).toBe("forbidden");
  });

  it("no se puede degradar al último administrador activo", async () => {
    const unico = await alta("admin", "unico@test.local");
    const editor = await alta("editor", "editor@test.local");

    expect(
      (await esperarError(() => updateUser(editor, unico.id, { role: "editor" }))).code,
    ).toBe("conflict");
  });

  it("tampoco desactivar al último administrador activo", async () => {
    const unico = await alta("admin", "unico@test.local");
    const editor = await alta("editor", "editor@test.local");

    expect(
      (await esperarError(() => updateUser(editor, unico.id, { active: false }))).code,
    ).toBe("conflict");
  });

  it("con dos administradores, degradar a uno sí se permite", async () => {
    const uno = await alta("admin", "uno@test.local");
    const dos = await alta("admin", "dos@test.local");

    await expect(updateUser(uno, dos.id, { role: "editor" })).resolves.toMatchObject({
      role: "editor",
    });
  });

});

describe("confirmación al borrar un tipo de contenido", () => {
  it("rechaza el borrado si el texto no coincide", async () => {
    const { crearTipo } = await import("../helpers");
    const { deleteContentType } = await import("@/lib/content-types");
    const tipo = await crearTipo("receta");

    const error = await esperarError(() => deleteContentType(tipo.id, "recetas"));

    expect(error.code).toBe("conflict");
    expect(error.message).toContain("receta");
  });

  it("borra cuando el texto coincide", async () => {
    const { crearTipo } = await import("../helpers");
    const { deleteContentType, listContentTypes } = await import(
      "@/lib/content-types"
    );
    const tipo = await crearTipo("receta");

    await deleteContentType(tipo.id, "receta");

    expect(await listContentTypes()).toHaveLength(0);
  });

  it("sin confirmación explícita sigue borrando (la API no la exige)", async () => {
    const { crearTipo } = await import("../helpers");
    const { deleteContentType, listContentTypes } = await import(
      "@/lib/content-types"
    );
    const tipo = await crearTipo("receta");

    await deleteContentType(tipo.id);

    expect(await listContentTypes()).toHaveLength(0);
  });
});
