import { and, asc, count, eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { db } from "@/db";
import {
  contentFields,
  contentTypes,
  entries,
  type ContentField,
  type ContentType,
  type ContentTypeWithFields,
} from "@/db/schema";
import { conflict, notFound } from "@/lib/errors";
import { TYPES_TAG, contentTag } from "@/lib/public-content";
import type {
  CreateContentTypeInput,
  CreateFieldInput,
} from "@/lib/validation/content";

const RESERVED_API_IDS = new Set([
  "auth",
  "content",
  "content-types",
  "media",
  "public",
  "users",
]);

async function fieldsOf(contentTypeId: string): Promise<ContentField[]> {
  return db
    .select()
    .from(contentFields)
    .where(eq(contentFields.contentTypeId, contentTypeId))
    .orderBy(asc(contentFields.position), asc(contentFields.createdAt));
}

export async function listContentTypes(): Promise<ContentTypeWithFields[]> {
  const types = await db
    .select()
    .from(contentTypes)
    .orderBy(asc(contentTypes.name));

  const fields = await db
    .select()
    .from(contentFields)
    .orderBy(asc(contentFields.position), asc(contentFields.createdAt));

  return types.map((type) => ({
    ...type,
    fields: fields.filter((field) => field.contentTypeId === type.id),
  }));
}

export type ContentTypeSummary = ContentType & {
  fieldCount: number;
  entryCount: number;
  publishedCount: number;
};

export async function listContentTypeSummaries(): Promise<ContentTypeSummary[]> {
  const rows = await db
    .select({
      id: contentTypes.id,
      name: contentTypes.name,
      apiId: contentTypes.apiId,
      description: contentTypes.description,
      createdAt: contentTypes.createdAt,
      entryCount: count(entries.id),
      publishedCount: sql<number>`count(*) filter (where ${entries.status} = 'published')`.mapWith(
        Number,
      ),
    })
    .from(contentTypes)
    .leftJoin(entries, eq(entries.contentTypeId, contentTypes.id))
    .groupBy(contentTypes.id)
    .orderBy(asc(contentTypes.name));

  const fields = await db
    .select({ contentTypeId: contentFields.contentTypeId })
    .from(contentFields);

  return rows.map((row) => ({
    ...row,
    fieldCount: fields.filter((field) => field.contentTypeId === row.id).length,
  }));
}

export async function getContentTypeById(
  id: string,
): Promise<ContentTypeWithFields> {
  const [type] = await db
    .select()
    .from(contentTypes)
    .where(eq(contentTypes.id, id))
    .limit(1);

  if (!type) throw notFound(`No existe el tipo de contenido ${id}`);
  return { ...type, fields: await fieldsOf(type.id) };
}

export async function getContentTypeByApiId(
  apiId: string,
): Promise<ContentTypeWithFields> {
  const [type] = await db
    .select()
    .from(contentTypes)
    .where(eq(contentTypes.apiId, apiId))
    .limit(1);

  if (!type) throw notFound(`No existe el tipo de contenido "${apiId}"`);
  return { ...type, fields: await fieldsOf(type.id) };
}

export async function createContentType(
  input: CreateContentTypeInput,
): Promise<ContentType> {
  if (RESERVED_API_IDS.has(input.apiId)) {
    throw conflict(`"${input.apiId}" es un identificador reservado`);
  }

  const [existing] = await db
    .select({ id: contentTypes.id })
    .from(contentTypes)
    .where(eq(contentTypes.apiId, input.apiId))
    .limit(1);

  if (existing) throw conflict(`Ya existe un tipo con el id "${input.apiId}"`);

  const [created] = await db
    .insert(contentTypes)
    .values({
      name: input.name,
      apiId: input.apiId,
      description: input.description ?? null,
    })
    .returning();

  revalidateTag(TYPES_TAG, "max");
  return created;
}

async function contarEntradas(contentTypeId: string): Promise<number> {
  const [fila] = await db
    .select({ value: count() })
    .from(entries)
    .where(eq(entries.contentTypeId, contentTypeId));

  return fila.value;
}

const PG_FOREIGN_KEY_VIOLATION = "23503";

function isForeignKeyViolation(error: unknown): boolean {
  let current: unknown = error;
  while (current instanceof Error) {
    if ((current as { code?: string }).code === PG_FOREIGN_KEY_VIOLATION) return true;
    current = current.cause;
  }
  return false;
}

export async function deleteContentType(
  id: string,
  confirmacion?: string,
): Promise<void> {
  const tipo = await getContentTypeById(id);

  /**
   * Se comprueba aquí y no solo en el formulario: una confirmación que vive
   * únicamente en la interfaz se salta con una petición suelta.
   */
  if (confirmacion !== undefined && confirmacion.trim() !== tipo.apiId) {
    const total = await contarEntradas(id);
    const contenido = total === 1 ? "su entrada" : `sus ${total} entradas`;

    throw conflict(
      `Para borrar «${tipo.name}» y ${contenido}, escribe exactamente «${tipo.apiId}».`,
    );
  }

  let deleted: { id: string } | undefined;

  try {
    [deleted] = await db
      .delete(contentTypes)
      .where(eq(contentTypes.id, id))
      .returning({ id: contentTypes.id });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      throw conflict(
        "Otro tipo de contenido tiene un campo de relación que apunta a este. Quita ese campo primero.",
      );
    }
    throw error;
  }

  if (!deleted) throw notFound(`No existe el tipo de contenido ${id}`);
  revalidateTag(TYPES_TAG, "max");
}

export async function addField(
  contentTypeId: string,
  input: CreateFieldInput,
): Promise<ContentField> {
  const type = await getContentTypeById(contentTypeId);

  if (type.fields.some((field) => field.apiKey === input.apiKey)) {
    throw conflict(`El campo "${input.apiKey}" ya existe en ${type.name}`);
  }

  if (input.type === "relation" && input.targetTypeId) {
    await getContentTypeById(input.targetTypeId);
  }

  const [created] = await db
    .insert(contentFields)
    .values({
      contentTypeId,
      label: input.label,
      apiKey: input.apiKey,
      type: input.type,
      required: input.required,
      choices: input.type === "select" ? (input.choices ?? []) : null,
      targetTypeId: input.type === "relation" ? input.targetTypeId : null,
      multiple: input.type === "relation" ? input.multiple : false,
      position: type.fields.length,
    })
    .returning();

  revalidateTag(contentTag(type.apiId), "max");
  return created;
}

export async function moveField(
  contentTypeId: string,
  fieldId: string,
  direction: "up" | "down",
): Promise<void> {
  const type = await getContentTypeById(contentTypeId);
  const index = type.fields.findIndex((field) => field.id === fieldId);

  if (index === -1) throw notFound(`No existe el campo ${fieldId}`);

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= type.fields.length) return;

  const ordered = [...type.fields];
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

  await db.transaction(async (tx) => {
    for (const [position, field] of ordered.entries()) {
      await tx
        .update(contentFields)
        .set({ position })
        .where(eq(contentFields.id, field.id));
    }
  });

  revalidateTag(contentTag(type.apiId), "max");
}

export async function deleteField(
  contentTypeId: string,
  fieldId: string,
): Promise<void> {
  const [deleted] = await db
    .delete(contentFields)
    .where(
      and(
        eq(contentFields.id, fieldId),
        eq(contentFields.contentTypeId, contentTypeId),
      ),
    )
    .returning({ id: contentFields.id });

  if (!deleted) throw notFound(`No existe el campo ${fieldId}`);
}
