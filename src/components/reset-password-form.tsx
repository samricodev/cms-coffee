"use client";

import { useActionState } from "react";

import { resetPasswordAction } from "@/app/admin/actions";
import { FieldError, FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { input, label, secondary } from "@/components/ui";
import { idleForm, issueOf } from "@/lib/form";

export function ResetPasswordForm({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [state, action] = useActionState(
    resetPasswordAction.bind(null, userId),
    idleForm,
  );

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs text-black/60 hover:underline dark:text-white/60">
        Cambiar su contraseña
      </summary>

      <form action={action} className="mt-3 max-w-sm space-y-3">
        <FormMessage state={state} />

        <div>
          <label className={label} htmlFor={`password-${userId}`}>
            Contraseña nueva para {email}
          </label>
          <input
            className={input}
            id={`password-${userId}`}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
          <p className="mt-1 text-xs text-black/60 dark:text-white/60">
            Cerrará todas sus sesiones. Tendrás que comunicársela por un canal
            seguro y pedirle que la cambie.
          </p>
          <FieldError message={issueOf(state, "password")} />
        </div>

        <SubmitButton className={secondary} pendingLabel="Cambiando…">
          Cambiar
        </SubmitButton>
      </form>
    </details>
  );
}
