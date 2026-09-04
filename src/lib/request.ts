import { headers } from "next/headers";

/**
 * IP del cliente según las cabeceras del proxy.
 *
 * Solo es fiable si delante hay un proxy que las reescriba: sin él, cualquiera
 * puede enviar `x-forwarded-for` y saltarse el límite por IP. Por eso el límite
 * por email, que no se puede falsificar, es el que de verdad protege una cuenta.
 */
export async function clientIp(): Promise<string | null> {
  const cabeceras = await headers();

  const reenviada = cabeceras.get("x-forwarded-for");
  if (reenviada) return reenviada.split(",")[0]!.trim();

  return cabeceras.get("x-real-ip") ?? null;
}
