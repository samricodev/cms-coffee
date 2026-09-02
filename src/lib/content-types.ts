import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  contentFields,
  contentTypes,
  type ContentField,
  type ContentType,
  type ContentTypeWithFields,
} from "@/db/schema";
import { conflict, notFound } from "@/lib/errors";
import type {
  CreateContentTypeInput,
  CreateFieldInput,
} from "@/lib/validation/content";

const RESERVED_API_IDS = new Set(["posts", "users", "auth", "content-types"]);

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

  return created;
}

export async function deleteContentType(id: string): Promise<void> {
  const [deleted] = await db
    .delete(contentTypes)
    .where(eq(contentTypes.id, id))
    .returning({ id: contentTypes.id });

  if (!deleted) throw notFound(`No existe el tipo de contenido ${id}`);
}

export async function addField(
  contentTypeId: string,
  input: CreateFieldInput,
): Promise<ContentField> {
  const type = await getContentTypeById(contentTypeId);

  if (type.fields.some((field) => field.apiKey === input.apiKey)) {
    throw conflict(`El campo "${input.apiKey}" ya existe en ${type.name}`);
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
      position: type.fields.length,
    })
    .returning();

  return created;
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
