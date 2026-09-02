"use client";

import { useActionState } from "react";

import { FieldError, FormMessage } from "@/components/form-message";
import { MediaPicker } from "@/components/media-picker";
import { RichTextInput } from "@/components/rich-text-input";
import { TagsInput } from "@/components/tags-input";
import { SubmitButton } from "@/components/submit-button";
import { input, label } from "@/components/ui";
import { idleForm, issueOf, valueOf, type FormState } from "@/lib/form";
import type { ContentField, Entry } from "@/db/schema";
import type { RelationOption } from "@/lib/relations";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: ContentField[];
  entry?: Entry;
  submitLabel: string;
  relationOptions?: Record<string, RelationOption[]>;
};

function asText(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function RelationField({
  field,
  value,
  options,
}: {
  field: ContentField;
  value: unknown;
  options: RelationOption[];
}) {
  const selected = new Set(
    Array.isArray(value) ? value.map(String) : value ? [String(value)] : [],
  );

  if (options.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        No hay entradas del tipo enlazado todavía.
      </p>
    );
  }

  if (!field.multiple) {
    return (
      <select
        id={`field-${field.apiKey}`}
        name={field.apiKey}
        required={field.required}
        className={input}
        defaultValue={[...selected][0] ?? ""}
      >
        <option value="">—</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.title}
            {option.status === "draft" ? " (borrador)" : ""}
          </option>
        ))}
      </select>
    );
  }

  return (
    <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-black/15 p-2 dark:border-white/20">
      {options.map((option) => (
        <li key={option.id}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={field.apiKey}
              value={option.id}
              defaultChecked={selected.has(option.id)}
              className="h-4 w-4"
            />
            {option.title}
            {option.status === "draft" ? (
              <span className="text-xs text-black/50 dark:text-white/50">
                borrador
              </span>
            ) : null}
          </label>
        </li>
      ))}
    </ul>
  );
}

function DynamicField({
  field,
  value,
  error,
  options,
}: {
  field: ContentField;
  value: unknown;
  error?: string;
  options: RelationOption[];
}) {
  const id = `field-${field.apiKey}`;
  const common = { id, name: field.apiKey, required: field.required };

  return (
    <div>
      <label className={label} htmlFor={id}>
        {field.label}
        {field.required ? " *" : ""}
      </label>

      {field.type === "relation" ? (
        <RelationField field={field} value={value} options={options} />
      ) : field.type === "richtext" ? (
        <RichTextInput id={id} name={field.apiKey} defaultValue={asText(value)} />
      ) : field.type === "tags" ? (
        <TagsInput id={id} name={field.apiKey} defaultValue={asText(value)} />
      ) : field.type === "media" ? (
        <MediaPicker id={id} name={field.apiKey} defaultValue={asText(value)} />
      ) : field.type === "textarea" ? (
        <textarea
          {...common}
          className={`${input} min-h-32`}
          defaultValue={asText(value)}
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
        <select {...common} className={input} defaultValue={asText(value)}>
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
          defaultValue={asText(value)}
        />
      )}

      <FieldError message={error} />
    </div>
  );
}

export function EntryForm({
  action,
  fields,
  entry,
  submitLabel,
  relationOptions = {},
}: Props) {
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
          options={relationOptions[field.apiKey] ?? []}
          value={
            state.status === "error" && state.values && field.type !== "relation"
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

      <details className="rounded-md border border-black/10 p-3 dark:border-white/15">
        <summary className="cursor-pointer text-sm font-medium">
          SEO y compartición
        </summary>

        <div className="mt-4 space-y-4">
          <div>
            <label className={label} htmlFor="seoDescription">
              Metadescripción
            </label>
            <textarea
              className={`${input} min-h-20`}
              id="seoDescription"
              name="seoDescription"
              maxLength={200}
              defaultValue={valueOf(
                state,
                "seoDescription",
                entry?.seoDescription ?? "",
              )}
            />
            <p className="mt-1 text-xs text-black/60 dark:text-white/60">
              El texto que aparece bajo el título en Google. Hasta 200
              caracteres; vacío lo borra.
            </p>
            <FieldError message={issueOf(state, "seoDescription")} />
          </div>

          <div>
            <label className={label} htmlFor="seoImageId">
              Imagen para compartir
            </label>
            <MediaPicker
              id="seoImageId"
              name="seoImageId"
              defaultValue={valueOf(state, "seoImageId", entry?.seoImageId ?? "")}
            />
            <FieldError message={issueOf(state, "seoImageId")} />
          </div>
        </div>
      </details>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
