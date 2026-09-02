"use client";

import { useActionState } from "react";

import { createContentTypeAction } from "@/app/admin/actions";
import { FieldError, FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { input, label } from "@/components/ui";
import { idleForm, issueOf, valueOf } from "@/lib/form";

export function ContentTypeForm() {
  const [state, action] = useActionState(createContentTypeAction, idleForm);

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="type-name">
            Nombre
          </label>
          <input
            className={input}
            id="type-name"
            name="name"
            defaultValue={valueOf(state, "name")}
            placeholder="Producto"
            required
          />
          <FieldError message={issueOf(state, "name")} />
        </div>

        <div>
          <label className={label} htmlFor="type-api-id">
            Identificador de API
          </label>
          <input
            className={input}
            id="type-api-id"
            name="apiId"
            defaultValue={valueOf(state, "apiId")}
            placeholder="producto"
            required
          />
          <FieldError message={issueOf(state, "apiId")} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="type-description">
          Descripción
        </label>
        <input
          className={input}
          id="type-description"
          name="description"
          defaultValue={valueOf(state, "description")}
        />
        <FieldError message={issueOf(state, "description")} />
      </div>

      <SubmitButton pendingLabel="Creando…">Crear tipo</SubmitButton>
    </form>
  );
}
