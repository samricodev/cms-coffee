import type { FormState } from "@/lib/form";

export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle") return null;

  const ok = state.status === "success";

  return (
    <p
      role="status"
      className={`rounded-md px-3 py-2 text-sm ${
        ok
          ? "bg-accent/10 text-accent"
          : "bg-red-500/10 text-red-700"
      }`}
    >
      {state.message}
    </p>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}
