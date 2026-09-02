"use client";

import { useActionState, useState } from "react";

import { addFieldAction } from "@/app/admin/actions";
import { FieldError, FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { input, label } from "@/components/ui";
import { idleForm, issueOf, valueOf } from "@/lib/form";

export function FieldForm({ contentTypeId }: { contentTypeId: string }) {
  const [state, action] = useActionState(
    addFieldAction.bind(null, contentTypeId),
    idleForm,
  );
  const echoedType = valueOf(state, "type", "text");
  const [type, setType] = useState(echoedType);
  const [lastState, setLastState] = useState(state);

  if (state !== lastState) {
    setLastState(state);
    setType(echoedType);
  }

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="field-label">
            Etiqueta
          </label>
          <input
            className={input}
            id="field-label"
            name="label"
            defaultValue={valueOf(state, "label")}
            placeholder="Precio"
            required
          />
          <FieldError message={issueOf(state, "label")} />
        </div>

        <div>
          <label className={label} htmlFor="field-api-key">
            Clave
          </label>
          <input
            className={input}
            id="field-api-key"
            name="apiKey"
            defaultValue={valueOf(state, "apiKey")}
            placeholder="precio"
            required
          />
          <FieldError message={issueOf(state, "apiKey")} />
        </div>

        <div>
          <label className={label} htmlFor="field-type">
            Tipo
          </label>
          <select
            key={echoedType}
            className={input}
            id="field-type"
            name="type"
            defaultValue={echoedType}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="text">Texto</option>
            <option value="textarea">Texto largo</option>
            <option value="number">Número</option>
            <option value="boolean">Sí / No</option>
            <option value="date">Fecha</option>
            <option value="select">Selección</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="required"
              defaultChecked={valueOf(state, "required") === "on"}
            />{" "}
            Obligatorio
          </label>
        </div>
      </div>

      {type === "select" ? (
        <div>
          <label className={label} htmlFor="field-choices">
            Opciones (separadas por comas)
          </label>
          <input
            className={input}
            id="field-choices"
            name="choices"
            defaultValue={valueOf(state, "choices")}
            placeholder="camisetas, tazas, pósters"
          />
          <FieldError message={issueOf(state, "choices")} />
        </div>
      ) : null}

      <SubmitButton pendingLabel="Añadiendo…">Añadir campo</SubmitButton>
    </form>
  );
}
