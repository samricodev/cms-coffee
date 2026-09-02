"use client";

import { useFormStatus } from "react-dom";

import { primary } from "@/components/ui";

export function SubmitButton({
  children,
  className = primary,
  pendingLabel = "Guardando…",
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || disabled} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}
