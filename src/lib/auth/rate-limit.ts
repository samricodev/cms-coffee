import { and, count, eq, gt, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { loginAttempts } from "@/db/schema";
import { tooManyRequests } from "@/lib/errors";

/**
 * Dos límites a la vez, con propósitos distintos:
 * el del email frena adivinar la contraseña de una cuenta concreta;
 * el de la IP frena barrer muchas cuentas desde el mismo sitio.
 */
const LIMITES = {
  email: { intentos: 5, ventanaMinutos: 15 },
  ip: { intentos: 20, ventanaMinutos: 15 },
} as const;

const clave = {
  email: (email: string) => `email:${email.trim().toLowerCase()}`,
  ip: (ip: string) => `ip:${ip}`,
};

function desde(minutos: number): Date {
  return new Date(Date.now() - minutos * 60_000);
}

async function fallosDesde(key: string, minutos: number): Promise<number> {
  const [fila] = await db
    .select({ value: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.key, key), gt(loginAttempts.createdAt, desde(minutos))));

  return fila.value;
}

async function esperaSegundos(key: string, minutos: number): Promise<number> {
  const [fila] = await db
    .select({ masAntiguo: sql<Date>`min(${loginAttempts.createdAt})` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.key, key), gt(loginAttempts.createdAt, desde(minutos))));

  if (!fila?.masAntiguo) return minutos * 60;

  const libreEn = new Date(fila.masAntiguo).getTime() + minutos * 60_000;
  return Math.max(1, Math.ceil((libreEn - Date.now()) / 1000));
}

/** Lanza 429 si el email o la IP han fallado demasiadas veces. */
export async function guardLogin(email: string, ip: string | null): Promise<void> {
  const comprobaciones = [
    { key: clave.email(email), ...LIMITES.email },
    ...(ip ? [{ key: clave.ip(ip), ...LIMITES.ip }] : []),
  ];

  for (const { key, intentos, ventanaMinutos } of comprobaciones) {
    if ((await fallosDesde(key, ventanaMinutos)) >= intentos) {
      const espera = await esperaSegundos(key, ventanaMinutos);

      throw tooManyRequests(
        `Demasiados intentos. Prueba de nuevo en ${Math.ceil(espera / 60)} minutos.`,
        espera,
      );
    }
  }
}

export async function registrarFalloLogin(
  email: string,
  ip: string | null,
): Promise<void> {
  const claves = [clave.email(email), ...(ip ? [clave.ip(ip)] : [])];

  await db.insert(loginAttempts).values(claves.map((key) => ({ key })));

  // Limpieza oportunista: sin esto la tabla crece para siempre y no hay ningún
  // proceso programado que la vacíe.
  if (Math.random() < 0.05) {
    await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, desde(60)));
  }
}

/** Un acierto borra los fallos de ese email: nadie se queda fuera por sus propias erratas. */
export async function limpiarFallosLogin(email: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.key, clave.email(email)));
}
