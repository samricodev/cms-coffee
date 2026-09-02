import { z } from "zod";

import type { ContentField } from "@/db/schema";

const apiKey = z
  .string()
  .trim()
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "Empieza por una letra y usa solo minúsculas, números y guion bajo",
  )
  .max(60);

export const createContentTypeSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  apiId: apiKey,
  description: z.string().trim().max(200).optional(),
});

export const createFieldSchema = z
  .object({
    label: z.string().trim().min(1, "La etiqueta es obligatoria").max(80),
    apiKey,
    type: z.enum([
      "text",
      "textarea",
      "richtext",
      "number",
      "boolean",
      "date",
      "select",
      "tags",
      "media",
      "relation",
    ]),
    required: z.boolean().default(false),
    choices: z.array(z.string().trim().min(1)).optional(),
    targetTypeId: z.uuid().optional(),
    multiple: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.type === "select" && (value.choices?.length ?? 0) === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "Un campo de selección necesita al menos una opción",
      });
    }

    if (value.type === "relation" && !value.targetTypeId) {
      ctx.addIssue({
        code: "custom",
        path: ["targetTypeId"],
        message: "Elige a qué tipo de contenido apunta la relación",
      });
    }
  });

const entryFields = {
  title: z.string().trim().min(1, "El título no puede estar vacío").max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug no válido")
    .max(80),
  status: z.enum(["draft", "published"]),
  publishedAt: z.iso
    .datetime({ local: true, offset: true })
    .or(z.literal("").transform(() => undefined)),
};

export const entryBaseSchema = z.object({
  title: entryFields.title,
  slug: entryFields.slug.optional(),
  status: entryFields.status.default("draft"),
  publishedAt: entryFields.publishedAt.optional(),
});

export const updateEntryBaseSchema = z.object(entryFields).partial();

export const listEntriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  status: z.enum(["draft", "published"]).optional().catch(undefined),
  q: z.string().trim().min(1).optional().catch(undefined),
});

function schemaForField(field: ContentField): z.ZodTypeAny {
  switch (field.type) {
    case "text":
    case "textarea": {
      const base = z.string().trim().max(field.type === "text" ? 500 : 20000);
      return field.required ? base.min(1, `${field.label} es obligatorio`) : base;
    }
    case "number":
      return z.coerce.number({ error: `${field.label} debe ser un número` });
    case "boolean":
      return z.boolean();
    case "date":
      return z.iso.date(`${field.label} debe tener formato AAAA-MM-DD`);
    case "select":
      return z.enum(
        (field.choices ?? []) as [string, ...string[]],
        `${field.label}: opción no válida`,
      );
    case "richtext": {
      const base = z.string().max(50000);
      return field.required ? base.min(1, `${field.label} es obligatorio`) : base;
    }
    case "tags": {
      const base = z
        .array(z.string().trim().min(1).max(60), {
          error: `${field.label} debe ser una lista de valores`,
        })
        .max(30, `${field.label}: máximo 30 valores`)
        .transform((values) => [...new Set(values)]);
      return field.required
        ? base.refine(
            (values) => values.length > 0,
            `${field.label} necesita al menos un valor`,
          )
        : base;
    }
    case "media":
      return z.uuid(`${field.label}: selecciona un archivo de la biblioteca`);
    case "relation": {
      const id = z.uuid(`${field.label}: referencia no válida`);

      if (!field.multiple) return id;

      return z
        .array(id, { error: `${field.label} debe ser una lista de referencias` })
        .max(50)
        .transform((values) => [...new Set(values)]);
    }
  }
}

export function buildEntryDataSchema(fields: ContentField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    const schema = schemaForField(field);

    shape[field.apiKey] = field.required
      ? z
          .any()
          .refine(
            (value) => value !== undefined && value !== null && value !== "",
            `${field.label} es obligatorio`,
          )
          .pipe(schema)
      : schema.optional();
  }

  return z.object(shape);
}

export type CreateContentTypeInput = z.infer<typeof createContentTypeSchema>;
export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type EntryBaseInput = z.infer<typeof entryBaseSchema>;
export type ListEntriesQuery = z.infer<typeof listEntriesQuerySchema>;
