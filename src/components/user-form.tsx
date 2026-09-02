"use client";

import { useActionState } from "react";

import { createUserAction } from "@/app/admin/actions";
import { FieldError, FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { input, label } from "@/components/ui";
import { idleForm, issueOf, valueOf } from "@/lib/form";

export function UserForm() {
  const [state, action] = useActionState(createUserAction, idleForm);

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="name">
            Nombre
          </label>
          <input
            className={input}
            id="name"
            name="name"
            defaultValue={valueOf(state, "name")}
            required
          />
          <FieldError message={issueOf(state, "name")} />
        </div>

        <div>
          <label className={label} htmlFor="new-email">
            Email
          </label>
          <input
            className={input}
            id="new-email"
            name="email"
            type="email"
            defaultValue={valueOf(state, "email")}
            required
          />
          <FieldError message={issueOf(state, "email")} />
        </div>

        <div>
          <label className={label} htmlFor="new-password">
            Contraseña
          </label>
          <input
            className={input}
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
          <FieldError message={issueOf(state, "password")} />
        </div>

        <div>
          <label className={label} htmlFor="role">
            Rol
          </label>
          <select
            className={input}
            id="role"
            name="role"
            defaultValue={valueOf(state, "role", "editor")}
          >
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
          </select>
          <FieldError message={issueOf(state, "role")} />
        </div>
      </div>

      <SubmitButton pendingLabel="Creando…">Crear cuenta</SubmitButton>
    </form>
  );
}
