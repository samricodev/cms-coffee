"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/admin/actions";
import { FieldError, FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { input, label } from "@/components/ui";
import { idleForm, issueOf, valueOf } from "@/lib/form";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, idleForm);

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />

      <div>
        <label className={label} htmlFor="email">
          Email
        </label>
        <input
          className={input}
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={valueOf(state, "email", "admin@cms.local")}
          required
        />
        <FieldError message={issueOf(state, "email")} />
      </div>

      <div>
        <label className={label} htmlFor="password">
          Contraseña
        </label>
        <input
          className={input}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError message={issueOf(state, "password")} />
      </div>

      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
    </form>
  );
}
