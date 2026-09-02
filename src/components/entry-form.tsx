"use client";

import { useActionState } from "react";

import { FieldError, FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { input, label } from "@/components/ui";
import { idleForm, issueOf, valueOf, type FormState } from "@/lib/form";
import type { ContentField, Entry } from "@/db/schema";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: ContentField[];
  entry?: Entry;
  submitLabel: string;
};

function DynamicField({
  field,
  value,
  error,
}: {
  field: ContentField;
  value: unknown;
  error?: string;
}) {
  const id = `field-${field.apiKey}`;
  const common = { id, name: field.apiKey, required: field.required };

  return (
    <div>
      <label className={label} htmlFor={id}>
        {field.label}
        {field.required ? " *" : ""}
      </label>

      {field.type === "textarea" ? (
        <textarea
          {...common}
          className={`${input} min-h-32`}
          defaultValue={typeof value === "string" ? value : ""}
        />
      ) : field.type === "boolean" ? (
        <input
          id={id}
          name={field.apiKey}
          type="checkbox"
          defaultChecked={value === true}
          className="h-4 w-4"
        />
      ) : field.type === "select" ? (
        <select
          {...common}
          className={input}
          defaultValue={typeof value === "string" ? value : ""}
        >
          <option value="">—</option>
          {(field.choices ?? []).map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...common}
          className={input}
          type={
            field.type === "number" ? "number" : field.type === "date" ? "date" : "text"
          }
          step={field.type === "number" ? "any" : undefined}
          defaultValue={
            typeof value === "string" || typeof value === "number"
              ? String(value)
              : ""
          }
        />
      )}

      <FieldError message={error} />
    </div>
  );
}

export function EntryForm({ action, fields, entry, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, idleForm);
  const data = entry?.data ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />

      <div>
        <label className={label} htmlFor="title">
          Título
        </label>
        <input
          className={input}
          id="title"
          name="title"
          defaultValue={valueOf(state, "title", entry?.title ?? "")}
          required
        />
        <FieldError message={issueOf(state, "title")} />
      </div>

      <div>
        <label className={label} htmlFor="slug">
          Slug
        </label>
        <input
          className={input}
          id="slug"
          name="slug"
          defaultValue={valueOf(state, "slug", entry?.slug ?? "")}
          placeholder={entry ? undefined : "Se genera a partir del título"}
        />
        <FieldError message={issueOf(state, "slug")} />
      </div>

      {fields.map((field) => (
        <DynamicField
          key={field.id}
          field={field}
          value={
            state.status === "error" && state.values
              ? field.type === "boolean"
                ? state.values[field.apiKey] === "on"
                : (state.values[field.apiKey] ?? "")
              : data[field.apiKey]
          }
          error={issueOf(state, field.apiKey)}
        />
      ))}

      <div>
        <label className={label} htmlFor="status">
          Estado
        </label>
        <select
          className={input}
          id="status"
          name="status"
          defaultValue={valueOf(state, "status", entry?.status ?? "draft")}
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
        </select>
      </div>

      <div>
        <label className={label} htmlFor="publishedAt">
          Publicar el
        </label>
        <input
          className={input}
          id="publishedAt"
          name="publishedAt"
          type="datetime-local"
          defaultValue={valueOf(
            state,
            "publishedAt",
            entry?.publishedAt
              ? new Date(
                  entry.publishedAt.getTime() -
                    entry.publishedAt.getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)
              : "",
          )}
        />
        <p className="mt-1 text-xs text-black/60 dark:text-white/60">
          Con una fecha futura, la entrada no aparece en la API pública hasta
          entonces.
        </p>
        <FieldError message={issueOf(state, "publishedAt")} />
      </div>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
