import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError, type AppErrorCode } from "@/lib/errors";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  invalid_input: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
};

export type ApiError = {
  error: { code: string; message: string; issues?: FieldIssue[] };
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
  if (error instanceof AppError) {
    return NextResponse.json<ApiError>(
      { error: { code: error.code, message: error.message } },
      { status: STATUS_BY_CODE[error.code] },
    );
  }

  console.error("[api] error no controlado", error);
  return NextResponse.json<ApiError>(
    { error: { code: "internal_error", message: "Error interno del servidor" } },
    { status: 500 },
  );
}
