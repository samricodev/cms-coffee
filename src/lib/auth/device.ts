import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";

import { db } from "@/db";
import { trustedDevices, users } from "@/db/schema";
import { hashToken } from "@/lib/auth/session";

/**
 * Un navegador desde el que alguien ya entró con éxito. No da acceso por sí
 * mismo: solo lo saca del límite por email, que es el que un atacante puede
 * llenar a propósito para dejar fuera al dueño de la cuenta.
 */
export const DEVICE_COOKIE = "cms_device";
const DEVICE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/** Hash del dispositivo si la cookie es válida para la cuenta de ese email. */
export async function dispositivoDeConfianza(email: string): Promise<string | null> {
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const [fila] = await db
    .select({ id: trustedDevices.id })
    .from(trustedDevices)
    .innerJoin(users, eq(users.id, trustedDevices.userId))
    .where(
      and(
        eq(trustedDevices.tokenHash, tokenHash),
        eq(users.email, email),
        gt(trustedDevices.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return fila ? tokenHash : null;
}

/** Tras un login correcto: renueva el dispositivo de este navegador. */
export async function recordarDispositivo(userId: string): Promise<void> {
  const almacen = await cookies();
  const anterior = almacen.get(DEVICE_COOKIE)?.value;

  if (anterior) {
    await db.delete(trustedDevices).where(eq(trustedDevices.tokenHash, hashToken(anterior)));
  }
  await db.delete(trustedDevices).where(lt(trustedDevices.expiresAt, new Date()));

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DEVICE_TTL_MS);

  await db.insert(trustedDevices).values({ tokenHash: hashToken(token), userId, expiresAt });

  almacen.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}
