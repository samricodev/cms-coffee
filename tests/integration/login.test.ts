import { beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";

import { limpiarBase, navegador } from "../helpers";
import { db } from "@/db";
import { loginAttempts, sessions } from "@/db/schema";
import { DEVICE_COOKIE } from "@/lib/auth/device";
import { iniciarSesion } from "@/lib/auth/login";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { createUser } from "@/lib/users";

const CLAVE = "contrasena-de-prueba";

async function codigoDeError(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (error) {
    if (error instanceof AppError) return error.code;
    throw error;
  }
  return null;
}

beforeEach(async () => {
  await limpiarBase();
  vi.mocked(cookies).mockReset();
});

describe("iniciarSesion", () => {
  it("con la contraseña correcta deja sesión y dispositivo en el navegador", async () => {
    const ana = await createUser({ email: "ana@test.local", name: "Ana", password: CLAVE, role: "editor" });
    const cookiesDelNavegador = navegador();

    const user = await iniciarSesion({ email: ana.email, password: CLAVE });

    expect(user.id).toBe(ana.id);
    expect(cookiesDelNavegador.get(SESSION_COOKIE)).toBeDefined();
    expect(cookiesDelNavegador.get(DEVICE_COOKIE)).toBeDefined();
    expect(await db.select().from(sessions)).toHaveLength(1);
  });

  it("con la contraseña incorrecta no deja nada y apunta el fallo", async () => {
    const ana = await createUser({ email: "ana@test.local", name: "Ana", password: CLAVE, role: "editor" });
    const cookiesDelNavegador = navegador();

    expect(await codigoDeError(() => iniciarSesion({ email: ana.email, password: "mala" }))).toBe(
      "unauthorized",
    );

    expect(cookiesDelNavegador.size).toBe(0);
    expect(await db.select().from(loginAttempts)).not.toHaveLength(0);
  });

  it("bloquea al sexto intento aunque la contraseña sea buena", async () => {
    const ana = await createUser({ email: "ana@test.local", name: "Ana", password: CLAVE, role: "editor" });
    navegador();

    for (let i = 0; i < 5; i++) await codigoDeError(() => iniciarSesion({ email: ana.email, password: "mala" }));

    expect(await codigoDeError(() => iniciarSesion({ email: ana.email, password: CLAVE }))).toBe(
      "too_many_requests",
    );
  });

  it("desde un navegador donde ya entró, el bloqueo del email no le afecta", async () => {
    const ana = await createUser({ email: "ana@test.local", name: "Ana", password: CLAVE, role: "editor" });
    const suNavegador = navegador();
    await iniciarSesion({ email: ana.email, password: CLAVE });
    const dispositivo = suNavegador.get(DEVICE_COOKIE)!;

    navegador();
    for (let i = 0; i < 5; i++) await codigoDeError(() => iniciarSesion({ email: ana.email, password: "mala" }));

    navegador().set(DEVICE_COOKIE, dispositivo);
    expect(await codigoDeError(() => iniciarSesion({ email: ana.email, password: CLAVE }))).toBeNull();
  });
});
