export type AppErrorCode = "not_found" | "conflict" | "invalid_input";

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
