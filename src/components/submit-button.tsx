"use client";

import { useFormStatus } from "react-dom";

import { primary } from "@/components/ui";

export function SubmitButton({
  children,
  className = primary,
  pendingLabel = "Guardando…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}
