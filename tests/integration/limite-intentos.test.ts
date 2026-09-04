import { beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";

import { limpiarBase } from "../helpers";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";
import {
  guardLogin,
  limpiarFallosLogin,
  registrarFalloLogin,
} from "@/lib/auth/rate-limit";
import { AppError } from "@/lib/errors";

const EMAIL = "editor@test.local";
const IP = "203.0.113.7";

async function esperarError(fn: () => Promise<unknown>): Promise<AppError> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("se esperaba un AppError y no se lanzó ninguno");
}

async function fallar(veces: number, email = EMAIL, ip: string | null = IP) {
  for (let i = 0; i < veces; i++) await registrarFalloLogin(email, ip);
}

beforeEach(limpiarBase);

describe("límite de intentos de login", () => {
  it("deja pasar mientras no se alcanza el límite", async () => {
    await fallar(4);
    await expect(guardLogin(EMAIL, IP)).resolves.toBeUndefined();
  });

  it("bloquea el email al quinto fallo", async () => {
    await fallar(5);

    const error = await esperarError(() => guardLogin(EMAIL, IP));
    expect(error.code).toBe("too_many_requests");
    expect(error.message).toContain("Demasiados intentos");
  });

  it("devuelve cuántos segundos hay que esperar", async () => {
    await fallar(5);

    const error = await esperarError(() => guardLogin(EMAIL, IP));
    const { retryAfterSeconds } = error.details as { retryAfterSeconds: number };

    expect(retryAfterSeconds).toBeGreaterThan(0);
    expect(retryAfterSeconds).toBeLessThanOrEqual(15 * 60);
  });

  it("bloquear un email no bloquea a los demás", async () => {
    await fallar(5);

    await expect(guardLogin("otro@test.local", IP)).resolves.toBeUndefined();
  });

  it("un acierto borra los fallos de ese email", async () => {
    await fallar(5);
    await esperarError(() => guardLogin(EMAIL, IP));

    await limpiarFallosLogin(EMAIL);

    await expect(guardLogin(EMAIL, IP)).resolves.toBeUndefined();
  });

  it("la IP frena el barrido de muchas cuentas distintas", async () => {
    // Cuatro fallos en cinco cuentas: ninguna llega a su límite, la IP sí.
    for (const n of [1, 2, 3, 4, 5]) await fallar(4, `cuenta${n}@test.local`, IP);

    const error = await esperarError(() => guardLogin("cuenta6@test.local", IP));
    expect(error.code).toBe("too_many_requests");
  });

  it("los fallos viejos dejan de contar al salir de la ventana", async () => {
    await fallar(5);
    await esperarError(() => guardLogin(EMAIL, IP));

    // Envejecemos los intentos 16 minutos: la ventana es de 15.
    await db
      .update(loginAttempts)
      .set({ createdAt: sql`now() - interval '16 minutes'` })
      .where(eq(loginAttempts.key, `email:${EMAIL}`));

    await expect(guardLogin(EMAIL, IP)).resolves.toBeUndefined();
  });

  it("sin IP conocida sigue aplicándose el límite por email", async () => {
    await fallar(5, EMAIL, null);

    expect((await esperarError(() => guardLogin(EMAIL, null))).code).toBe(
      "too_many_requests",
    );
  });
});

describe("borrar archivos en uso", () => {
  it("rechaza el borrado si una entrada usa el archivo", async () => {
    const { crearTipo, crearUsuario } = await import("../helpers");
    const { db } = await import("@/db");
    const { media } = await import("@/db/schema");
    const { createEntry } = await import("@/lib/entries");
    const { deleteMedia, listMediaUsage } = await import("@/lib/media");

    const actor = await crearUsuario("admin", "admin@test.local");
    const tipo = await crearTipo("cafe", [{ apiKey: "foto", type: "media" }]);

    const [archivo] = await db
      .insert(media)
      .values({
        filename: "grano.png",
        mimeType: "image/png",
        size: 10,
        storageKey: "abc.png",
        uploadedBy: actor.id,
      })
      .returning();

    await createEntry(tipo, { title: "Chelbesa", status: "draft" }, { foto: archivo.id }, actor);

    expect(await listMediaUsage(archivo.id)).toHaveLength(1);

    const error = await esperarError(() => deleteMedia(archivo.id, actor));
    expect(error.code).toBe("conflict");
    expect(error.message).toContain("Chelbesa");
  });

  it("permite borrarlo cuando nadie lo usa", async () => {
    const { crearUsuario } = await import("../helpers");
    const { db } = await import("@/db");
    const { media } = await import("@/db/schema");
    const { deleteMedia, listMedia } = await import("@/lib/media");

    const actor = await crearUsuario("admin", "admin@test.local");
    const [archivo] = await db
      .insert(media)
      .values({
        filename: "suelto.png",
        mimeType: "image/png",
        size: 10,
        storageKey: "suelto.png",
        uploadedBy: actor.id,
      })
      .returning();

    await deleteMedia(archivo.id, actor);

    expect(await listMedia()).toHaveLength(0);
  });
});
