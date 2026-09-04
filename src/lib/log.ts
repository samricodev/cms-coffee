import { randomUUID } from "node:crypto";

type Contexto = Record<string, unknown>;

function serializar(error: unknown, profundidad = 0): unknown {
  if (!(error instanceof Error)) return { valor: String(error) };

  return {
    nombre: error.name,
    mensaje: error.message,
    // El código de Postgres viaja aquí cuando el error viene del driver.
    codigo: (error as { code?: string }).code,
    stack: error.stack?.split("\n").slice(0, 8).join("\n"),
    // Drizzle envuelve los errores de `pg`: sin la causa se pierde el motivo real.
    causa: profundidad < 2 && error.cause ? serializar(error.cause, profundidad + 1) : undefined,
  };
}

/**
 * Registra un error y devuelve un identificador corto.
 *
 * Ese identificador se le enseña a quien sufrió el fallo y queda en el registro,
 * de modo que «me salió el error 4f2a91c3» se convierte en una línea concreta
 * en vez de en una búsqueda a ciegas por la hora aproximada.
 */
export function logError(error: unknown, contexto: Contexto = {}): string {
  const id = randomUUID().slice(0, 8);

  // Una línea de JSON por evento: es lo que saben leer los agregadores de
  // registros, y sigue siendo legible en una terminal.
  console.error(
    JSON.stringify({
      nivel: "error",
      id,
      hora: new Date().toISOString(),
      ...contexto,
      error: serializar(error),
    }),
  );

  return id;
}

export function logInfo(mensaje: string, contexto: Contexto = {}): void {
  console.log(
    JSON.stringify({
      nivel: "info",
      hora: new Date().toISOString(),
      mensaje,
      ...contexto,
    }),
  );
}
