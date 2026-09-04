"use client";

import { useActionState } from "react";

import { changePasswordAction } from "@/app/admin/actions";
import { FieldError, FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { input, label } from "@/components/ui";
import { idleForm, issueOf } from "@/lib/form";

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, idleForm);

  return (
    <form action={action} className="max-w-md space-y-4">
      <FormMessage state={state} />

      <div>
        <label className={label} htmlFor="current">
          Contraseña actual
        </label>
        <input
          className={input}
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError message={issueOf(state, "current")} />
      </div>

      <div>
        <label className={label} htmlFor="next">
          Contraseña nueva
        </label>
        <input
          className={input}
          id="next"
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
        <p className="mt-1 text-xs text-black/60 dark:text-white/60">
          Al menos 12 caracteres. La longitud importa más que los símbolos.
        </p>
        <FieldError message={issueOf(state, "next")} />
      </div>

      <div>
        <label className={label} htmlFor="repeat">
          Repite la nueva
        </label>
        <input
          className={input}
          id="repeat"
          name="repeat"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError message={issueOf(state, "repeat")} />
      </div>

      <SubmitButton pendingLabel="Cambiando…">Cambiar contraseña</SubmitButton>
    </form>
  );
}
