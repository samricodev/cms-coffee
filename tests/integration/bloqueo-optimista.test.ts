import { beforeEach, describe, expect, it } from "vitest";

import { crearTipo, crearUsuario, limpiarBase } from "../helpers";
import { AppError } from "@/lib/errors";
import { createEntry, getEntry, updateEntry } from "@/lib/entries";
import type { ContentTypeWithFields } from "@/db/schema";
import type { SessionUser } from "@/lib/auth/session";

async function esperarError(fn: () => Promise<unknown>): Promise<AppError> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("se esperaba un AppError y no se lanzó ninguno");
}

let tipo: ContentTypeWithFields;
let ana: SessionUser;
let luis: SessionUser;

beforeEach(async () => {
  await limpiarBase();
  tipo = await crearTipo("nota", [{ apiKey: "cuerpo", type: "text" }]);
  ana = await crearUsuario("admin", "ana@test.local", "Ana");
  luis = await crearUsuario("admin", "luis@test.local", "Luis");
});

async function crearNota() {
  return createEntry(tipo, { title: "Borrador", status: "draft" }, { cuerpo: "uno" }, ana);
}

describe("bloqueo optimista al editar", () => {
  it("guarda si nadie tocó la entrada mientras tanto", async () => {
    const nota = await crearNota();

    const guardada = await updateEntry(
      tipo,
      nota.id,
      { title: "Editado" },
      { cuerpo: "dos" },
      ana,
      nota.updatedAt,
    );

    expect(guardada.title).toBe("Editado");
  });

  it("rechaza la segunda escritura cuando otra persona guardó por en medio", async () => {
    const nota = await crearNota();

    // Ana y Luis abren la misma entrada: los dos tienen la misma marca.
    const marcaQueVioLuis = nota.updatedAt;

    await updateEntry(tipo, nota.id, { title: "Versión de Ana" }, { cuerpo: "ana" }, ana, nota.updatedAt);

    const error = await esperarError(() =>
      updateEntry(tipo, nota.id, { title: "Versión de Luis" }, { cuerpo: "luis" }, luis, marcaQueVioLuis),
    );

    expect(error.code).toBe("conflict");
    expect(error.message).toContain("Ana");
    expect(error.message).toContain("Recarga");
  });

  it("no pierde el trabajo de quien guardó primero", async () => {
    const nota = await crearNota();
    const marcaQueVioLuis = nota.updatedAt;

    await updateEntry(tipo, nota.id, { title: "Versión de Ana" }, { cuerpo: "ana" }, ana, nota.updatedAt);
    await esperarError(() =>
      updateEntry(tipo, nota.id, { title: "Versión de Luis" }, { cuerpo: "luis" }, luis, marcaQueVioLuis),
    );

    const enBase = await getEntry(tipo, nota.id);
    expect(enBase.title).toBe("Versión de Ana");
    expect(enBase.data.cuerpo).toBe("ana");
  });

  it("tras recargar, la escritura de Luis sí entra", async () => {
    const nota = await crearNota();

    await updateEntry(tipo, nota.id, { title: "Versión de Ana" }, { cuerpo: "ana" }, ana, nota.updatedAt);

    const recargada = await getEntry(tipo, nota.id);
    const guardada = await updateEntry(
      tipo,
      nota.id,
      { title: "Versión de Luis" },
      { cuerpo: "luis" },
      luis,
      recargada.updatedAt,
    );

    expect(guardada.title).toBe("Versión de Luis");
  });

  it("sin marca esperada no comprueba nada: la última escritura gana", async () => {
    const nota = await crearNota();

    await updateEntry(tipo, nota.id, { title: "Ana" }, { cuerpo: "ana" }, ana, nota.updatedAt);
    const guardada = await updateEntry(tipo, nota.id, { title: "Luis" }, { cuerpo: "luis" }, luis);

    expect(guardada.title).toBe("Luis");
  });

  it("registra quién hizo la última modificación", async () => {
    const nota = await crearNota();

    const guardada = await updateEntry(tipo, nota.id, { title: "x" }, { cuerpo: "x" }, luis, nota.updatedAt);

    expect(guardada.updatedBy).toBe(luis.id);
  });
});
