import { beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";

import { crearUsuario, limpiarBase } from "../helpers";
import { db } from "@/db";
import { trustedDevices } from "@/db/schema";
import { DEVICE_COOKIE, dispositivoDeConfianza, recordarDispositivo } from "@/lib/auth/device";
import { guardLogin, registrarFalloLogin } from "@/lib/auth/rate-limit";
import { AppError } from "@/lib/errors";

const IP = "203.0.113.7";

/** Un navegador de mentira: guarda lo que se le pone con `set` y lo devuelve con `get`. */
function navegador() {
  const guardadas = new Map<string, string>();

  vi.mocked(cookies).mockResolvedValue({
    get: (nombre: string) => {
      const value = guardadas.get(nombre);
      return value === undefined ? undefined : { name: nombre, value };
    },
    set: (nombre: string, value: string) => void guardadas.set(nombre, value),
    delete: (nombre: string) => void guardadas.delete(nombre),
  } as unknown as Awaited<ReturnType<typeof cookies>>);

  return guardadas;
}

async function fallar(veces: number, email: string, dispositivo: string | null = null) {
  for (let i = 0; i < veces; i++) await registrarFalloLogin(email, IP, dispositivo);
}

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

describe("dispositivos de confianza", () => {
  it("el dueño entra aunque un atacante haya bloqueado su email", async () => {
    const admin = await crearUsuario("admin");
    navegador();
    await recordarDispositivo(admin.id);

    await fallar(5, admin.email);
    expect(await codigoDeError(() => guardLogin(admin.email, IP))).toBe("too_many_requests");

    const dispositivo = await dispositivoDeConfianza(admin.email);
    expect(dispositivo).not.toBeNull();
    expect(await codigoDeError(() => guardLogin(admin.email, IP, dispositivo))).toBeNull();
  });

  it("tiene su propio límite, que no afecta a otros navegadores", async () => {
    const admin = await crearUsuario("admin");
    navegador();
    await recordarDispositivo(admin.id);
    const dispositivo = await dispositivoDeConfianza(admin.email);

    await fallar(5, admin.email, dispositivo);

    expect(await codigoDeError(() => guardLogin(admin.email, IP, dispositivo))).toBe(
      "too_many_requests",
    );
    expect(await codigoDeError(() => guardLogin(admin.email, IP))).toBeNull();
  });

  it("solo vale para la cuenta que entró desde ese navegador", async () => {
    const editor = await crearUsuario("editor");
    const admin = await crearUsuario("admin");
    navegador();
    await recordarDispositivo(editor.id);

    expect(await dispositivoDeConfianza(editor.email)).not.toBeNull();
    expect(await dispositivoDeConfianza(admin.email)).toBeNull();
  });

  it("sin cookie, o con una inventada, no hay dispositivo", async () => {
    const admin = await crearUsuario("admin");
    const cookiesDelNavegador = navegador();

    expect(await dispositivoDeConfianza(admin.email)).toBeNull();

    cookiesDelNavegador.set(DEVICE_COOKIE, "inventada");
    expect(await dispositivoDeConfianza(admin.email)).toBeNull();
  });

  it("caduca", async () => {
    const admin = await crearUsuario("admin");
    navegador();
    await recordarDispositivo(admin.id);

    await db.update(trustedDevices).set({ expiresAt: new Date(Date.now() - 1000) });

    expect(await dispositivoDeConfianza(admin.email)).toBeNull();
  });

  it("cada login renueva la cookie y no acumula filas", async () => {
    const admin = await crearUsuario("admin");
    const cookiesDelNavegador = navegador();

    await recordarDispositivo(admin.id);
    const primera = cookiesDelNavegador.get(DEVICE_COOKIE);
    await recordarDispositivo(admin.id);

    expect(cookiesDelNavegador.get(DEVICE_COOKIE)).not.toBe(primera);
    expect(await db.select().from(trustedDevices)).toHaveLength(1);
  });
});
