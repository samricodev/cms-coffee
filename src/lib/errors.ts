export type AppErrorCode =
  | "not_found"
  | "conflict"
  | "invalid_input"
  | "unauthorized"
  | "forbidden";

export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (message: string) => new AppError("not_found", message);
export const conflict = (message: string, details?: unknown) =>
  new AppError("conflict", message, details);

/** 401: no sabemos quién eres. */
export const unauthorized = (message = "Necesitas iniciar sesión") =>
  new AppError("unauthorized", message);

/** 403: sabemos quién eres y aun así no puedes. */
export const forbidden = (message = "No tienes permiso para esta acción") =>
  new AppError("forbidden", message);
