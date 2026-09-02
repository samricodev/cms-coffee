import { ZodError } from "zod";

import { AppError } from "@/lib/errors";

export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; issues?: Record<string, string> };

export const idleForm: FormState = { status: "idle" };

export function issueOf(state: FormState, field: string): string | undefined {
  return state.status === "error" ? state.issues?.[field] : undefined;
}

export function toFormState(error: unknown): FormState {
  if (error instanceof ZodError) {
    const issues: Record<string, string> = {};
    for (const issue of error.issues) {
      const field = issue.path.join(".") || "form";
      issues[field] ??= issue.message;
    }
    return { status: "error", message: "Revisa los campos marcados", issues };
  }

  if (error instanceof AppError) {
    return { status: "error", message: error.message };
  }

  console.error("[form] error no controlado", error);
  return { status: "error", message: "Error interno del servidor" };
}
