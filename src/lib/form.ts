import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";

import { AppError } from "@/lib/errors";
import { logError } from "@/lib/log";

export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message: string;
      issues?: Record<string, string>;
      values?: Record<string, string>;
    };

export const idleForm: FormState = { status: "idle" };

const SECRET_KEYS = new Set(["password"]);

export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !SECRET_KEYS.has(key)) values[key] = value;
  }

  return values;
}

export function valueOf(state: FormState, field: string, fallback = ""): string {
  return state.status === "error" ? (state.values?.[field] ?? fallback) : fallback;
}

export function issueOf(state: FormState, field: string): string | undefined {
  return state.status === "error" ? state.issues?.[field] : undefined;
}

export function toFormState(
  error: unknown,
  values?: Record<string, string>,
): FormState {
  unstable_rethrow(error);

  if (error instanceof ZodError) {
    const issues: Record<string, string> = {};
    for (const issue of error.issues) {
      const field = issue.path.join(".") || "form";
      issues[field] ??= issue.message;
    }
    return {
      status: "error",
      message: "Revisa los campos marcados",
      issues,
      values,
    };
  }

  if (error instanceof AppError) {
    return { status: "error", message: error.message, values };
  }

  const id = logError(error, { origen: "formulario" });

  return {
    status: "error",
    message: `Error interno del servidor. Referencia: ${id}`,
    values,
  };
}
