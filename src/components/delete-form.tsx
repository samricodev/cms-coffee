"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { danger } from "@/components/ui";
import { idleForm, type FormState } from "@/lib/form";

export function DeleteForm({
  action,
  label,
  className = danger,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  label: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, idleForm);

  return (
    <div className="space-y-2">
      <FormMessage state={state} />
      <form action={formAction}>
        <SubmitButton className={className} pendingLabel="Borrando…">
          {label}
        </SubmitButton>
      </form>
    </div>
  );
}
