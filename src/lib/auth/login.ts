import { cookies } from "next/headers";

import { dispositivoDeConfianza, recordarDispositivo } from "@/lib/auth/device";
import { guardLogin, limpiarFallosLogin, registrarFalloLogin } from "@/lib/auth/rate-limit";
import {
  SESSION_COOKIE,
  createSession,
  sessionCookieOptions,
  type SessionUser,
} from "@/lib/auth/session";
import { clientIp } from "@/lib/request";
import { authenticate } from "@/lib/users";
import type { LoginInput } from "@/lib/validation/auth";

/**
 * El login completo: límites, credenciales, dispositivo y sesión. Lo usan la
 * API y el formulario del panel; si cada uno tuviera su copia, un cambio de
 * seguridad en uno podría olvidarse en el otro.
 */
export async function iniciarSesion(input: LoginInput): Promise<SessionUser> {
  const ip = await clientIp();
  const dispositivo = await dispositivoDeConfianza(input.email);
  await guardLogin(input.email, ip, dispositivo);

  let user;
  try {
    user = await authenticate(input);
  } catch (error) {
    await registrarFalloLogin(input.email, ip, dispositivo);
    throw error;
  }

  await limpiarFallosLogin(input.email, dispositivo);
  await recordarDispositivo(user.id);

  const { token, expiresAt } = await createSession(user.id);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));

  return user;
}
