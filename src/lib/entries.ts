import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  or,
  sql,
} from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { db } from "@/db";
import {
  contentFields,
  contentTypes,
  entries,
  users,
  type ContentField,
  type ContentTypeWithFields,
  type Entry,
} from "@/db/schema";
import { assertCanModify } from "@/lib/auth/guards";
import type { SessionUser } from "@/lib/auth/session";
import { conflict, notFound } from "@/lib/errors";
import { REFERENCES_TAG, SEARCH_TAG, contentTag } from "@/lib/public-content";
import { slugify } from "@/lib/slug";
import {
  buildEntryDataSchema,
  type EntryBaseInput,
  type ListEntriesQuery,
} from "@/lib/validation/content";

const PG_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  while (current instanceof Error) {
    if ((current as { code?: string }).code === PG_UNIQUE_VIOLATION) return true;
    current = current.cause;
  }
  return false;
}

export type EntryListItem = Entry & { authorName: string | null };

export type PaginatedEntries = {
  items: EntryListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export function entryDataSchema(type: ContentTypeWithFields) {
  return buildEntryDataSchema(type.fields);
}

export async function listEntries(
  type: ContentTypeWithFields,
  query: ListEntriesQuery,
): Promise<PaginatedEntries> {
  const { page, limit, status, q } = query;

  const where = and(
    eq(entries.contentTypeId, type.id),
    status ? eq(entries.status, status) : undefined,
    q
      ? sql`${entries.searchVector} @@ websearch_to_tsquery('spanish', ${q})`
      : undefined,
  );

  const [items, [totals]] = await Promise.all([
    db
      .select({ ...getTableColumns(entries), authorName: users.name })
      .from(entries)
      .leftJoin(users, eq(users.id, entries.authorId))
      .where(where)
      .orderBy(
        q
          ? desc(
              sql`ts_rank(${entries.searchVector}, websearch_to_tsquery('spanish', ${q}))`,
            )
          : desc(entries.createdAt),
      )
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(entries).where(where),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total: totals.value,
      totalPages: Math.max(1, Math.ceil(totals.value / limit)),
    },
  };
}

export async function getEntry(
  type: ContentTypeWithFields,
  id: string,
): Promise<Entry> {
  const [entry] = await db
    .select()
    .from(entries)
    .where(and(eq(entries.id, id), eq(entries.contentTypeId, type.id)))
    .limit(1);

  if (!entry) throw notFound(`No existe la entrada ${id} en ${type.name}`);
  return entry;
}

export async function createEntry(
  type: ContentTypeWithFields,
  base: EntryBaseInput,
  data: Record<string, unknown>,
  actor: SessionUser,
): Promise<Entry> {
  const slug = base.slug ?? slugify(base.title);
  if (!slug) throw conflict("No se pudo derivar un slug del título");

  try {
    const [created] = await db
      .insert(entries)
      .values({
        contentTypeId: type.id,
        title: base.title,
        slug,
        status: base.status,
        data,
        authorId: actor.id,
        seoDescription: base.seoDescription ?? null,
        seoImageId: base.seoImageId ?? null,
        publishedAt: base.publishedAt
          ? new Date(base.publishedAt)
          : base.status === "published"
            ? new Date()
            : null,
      })
      .returning();

    revalidateTag(contentTag(type.apiId), "max");
    revalidateTag(REFERENCES_TAG, "max");
    revalidateTag(SEARCH_TAG, "max");
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict(`Ya existe una entrada con el slug "${slug}" en ${type.name}`);
    }
    throw error;
  }
}

const formatoHora = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
});

async function mensajeDeConflicto(current: Entry): Promise<string> {
  const [quien] = current.updatedBy
    ? await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, current.updatedBy))
        .limit(1)
    : [];

  const autor = quien?.name ?? "Otra persona";

  return `${autor} guardó esta entrada el ${formatoHora.format(current.updatedAt)}, después de que tú la abrieras. Recarga la página para ver sus cambios; si guardas ahora, los borrarías.`;
}

export async function updateEntry(
  type: ContentTypeWithFields,
  id: string,
  base: Partial<EntryBaseInput>,
  data: Record<string, unknown>,
  actor: SessionUser,
  expectedUpdatedAt?: Date,
): Promise<Entry> {
  const current = await getEntry(type, id);
  assertCanModify(actor, current);

  /**
   * Bloqueo optimista: el formulario envía la marca de tiempo que cargó. Si en
   * la base hay otra, alguien guardó por en medio y esta escritura borraría su
   * trabajo sin que nadie se entere.
   */
  if (
    expectedUpdatedAt &&
    current.updatedAt.getTime() !== expectedUpdatedAt.getTime()
  ) {
    throw conflict(await mensajeDeConflicto(current));
  }

  const { publishedAt, ...fields } = base;

  // undefined = no se envió el campo, no lo toques.
  // null = se envió vacío, bórralo.
  const scheduled =
    publishedAt === undefined
      ? undefined
      : publishedAt === null
        ? null
        : new Date(publishedAt);

  const becomesPublished =
    base.status === "published" &&
    current.publishedAt === null &&
    scheduled === undefined;

  try {
    const [updated] = await db
      .update(entries)
      .set({
        ...fields,
        data,
        ...(scheduled !== undefined ? { publishedAt: scheduled } : {}),
        ...(becomesPublished ? { publishedAt: new Date() } : {}),
        updatedBy: actor.id,
        updatedAt: new Date(),
      })
      .where(eq(entries.id, id))
      .returning();

    revalidateTag(contentTag(type.apiId), "max");
    revalidateTag(REFERENCES_TAG, "max");
    revalidateTag(SEARCH_TAG, "max");
    return updated;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict(`Ya existe una entrada con el slug "${base.slug}"`);
    }
    throw error;
  }
}

export type EntrySummary = {
  id: string;
  title: string;
  slug: string;
  status: Entry["status"];
  typeName: string;
  typeApiId: string;
};

function relationMatch(field: ContentField, entryId: string) {
  const shape = field.multiple
    ? { [field.apiKey]: [entryId] }
    : { [field.apiKey]: entryId };

  return and(
    eq(entries.contentTypeId, field.contentTypeId),
    sql`${entries.data} @> ${JSON.stringify(shape)}::jsonb`,
  );
}

export async function listReferencing(entryId: string): Promise<EntrySummary[]> {
  const relations = await db
    .select()
    .from(contentFields)
    .where(eq(contentFields.type, "relation"));

  if (relations.length === 0) return [];

  return db
    .select({
      id: entries.id,
      title: entries.title,
      slug: entries.slug,
      status: entries.status,
      typeName: contentTypes.name,
      typeApiId: contentTypes.apiId,
    })
    .from(entries)
    .innerJoin(contentTypes, eq(contentTypes.id, entries.contentTypeId))
    .where(or(...relations.map((field) => relationMatch(field, entryId))))
    .orderBy(desc(entries.createdAt))
    .limit(50);
}

export async function deleteEntry(
  type: ContentTypeWithFields,
  id: string,
  actor: SessionUser,
): Promise<void> {
  const current = await getEntry(type, id);
  assertCanModify(actor, current);

  const referencing = await listReferencing(id);

  if (referencing.length > 0) {
    const names = referencing
      .slice(0, 3)
      .map((item) => `"${item.title}"`)
      .join(", ");

    throw conflict(
      `No se puede borrar: ${referencing.length} entrada(s) la referencian (${names}). Quita esas referencias primero.`,
    );
  }

  await db.delete(entries).where(eq(entries.id, id));
  revalidateTag(contentTag(type.apiId), "max");
  revalidateTag(REFERENCES_TAG, "max");
  revalidateTag(SEARCH_TAG, "max");
}
