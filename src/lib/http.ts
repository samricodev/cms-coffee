import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError, type AppErrorCode } from "@/lib/errors";
import { logError } from "@/lib/log";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  invalid_input: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  too_many_requests: 429,
};

export type ApiError = {
  error: { code: string; message: string; issues?: FieldIssue[]; id?: string };
};

type FieldIssue = { field: string; message: string };

export async function readJson(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function badRequest(message: string) {
  return NextResponse.json<ApiError>(
    { error: { code: "bad_request", message } },
    { status: 400 },
  );
}

export function unprocessable(error: ZodError) {
  const issues: FieldIssue[] = error.issues.map((issue) => ({
    field: issue.path.join(".") || "(cuerpo)",
    message: issue.message,
  }));

  return NextResponse.json<ApiError>(
    {
      error: {
        code: "validation_error",
        message: "Los datos enviados no son válidos",
        issues,
      },
    },
    { status: 422 },
  );
}

export function errorResponse(error: unknown) {
  unstable_rethrow(error);

  if (error instanceof AppError) {
    const espera =
      error.code === "too_many_requests"
        ? (error.details as { retryAfterSeconds?: number } | undefined)
            ?.retryAfterSeconds
        : undefined;

    return NextResponse.json<ApiError>(
      { error: { code: error.code, message: error.message } },
      {
        status: STATUS_BY_CODE[error.code],
        headers: espera ? { "Retry-After": String(espera) } : undefined,
      },
    );
  }

  // Al cliente solo le llega un mensaje genérico más el identificador con el
  // que localizar la línea del registro. Los detalles internos no se filtran.
  const id = logError(error, { origen: "api" });

  return NextResponse.json<ApiError>(
    {
      error: {
        code: "internal_error",
        message: "Error interno del servidor",
        id,
      },
    },
    { status: 500 },
  );
}
