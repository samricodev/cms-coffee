import { and, count, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { db } from "@/db";
import { entries, users, type ContentTypeWithFields, type Entry } from "@/db/schema";
import { assertCanModify } from "@/lib/auth/guards";
import type { SessionUser } from "@/lib/auth/session";
import { conflict, notFound } from "@/lib/errors";
import { contentTag } from "@/lib/public-content";
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
      ? or(
          ilike(entries.title, `%${q}%`),
          sql`${entries.data}::text ilike ${`%${q}%`}`,
        )
      : undefined,
  );

  const [items, [totals]] = await Promise.all([
    db
      .select({ ...getTableColumns(entries), authorName: users.name })
      .from(entries)
      .leftJoin(users, eq(users.id, entries.authorId))
      .where(where)
      .orderBy(desc(entries.createdAt))
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
        publishedAt: base.publishedAt
          ? new Date(base.publishedAt)
          : base.status === "published"
            ? new Date()
            : null,
      })
      .returning();

    revalidateTag(contentTag(type.apiId), "max");
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict(`Ya existe una entrada con el slug "${slug}" en ${type.name}`);
    }
    throw error;
  }
}

export async function updateEntry(
  type: ContentTypeWithFields,
  id: string,
  base: Partial<EntryBaseInput>,
  data: Record<string, unknown>,
  actor: SessionUser,
): Promise<Entry> {
  const current = await getEntry(type, id);
  assertCanModify(actor, current);

  const { publishedAt, ...fields } = base;
  const scheduled = publishedAt ? new Date(publishedAt) : undefined;

  const becomesPublished =
    base.status === "published" && current.publishedAt === null && !scheduled;

  try {
    const [updated] = await db
      .update(entries)
      .set({
        ...fields,
        data,
        ...(scheduled ? { publishedAt: scheduled } : {}),
        ...(becomesPublished ? { publishedAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(entries.id, id))
      .returning();

    revalidateTag(contentTag(type.apiId), "max");
    return updated;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict(`Ya existe una entrada con el slug "${base.slug}"`);
    }
    throw error;
  }
}

export async function deleteEntry(
  type: ContentTypeWithFields,
  id: string,
  actor: SessionUser,
): Promise<void> {
  const current = await getEntry(type, id);
  assertCanModify(actor, current);
  await db.delete(entries).where(eq(entries.id, id));
  revalidateTag(contentTag(type.apiId), "max");
}
