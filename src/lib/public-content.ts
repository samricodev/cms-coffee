import { and, asc, desc, eq, isNotNull, lte, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import {
  contentFields,
  contentTypes,
  entries,
  type ContentTypeWithFields,
} from "@/db/schema";
import { attachExpansion, resolveRelations, type ExpandedEntry } from "@/lib/relations";

export const contentTag = (apiId: string) => `content:${apiId}`;
export const TYPES_TAG = "content-types";
export const REFERENCES_TAG = "references";

export type PublicEntry = {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  seoDescription: string | null;
  seoImageId: string | null;
  data: Record<string, unknown>;
  expanded?: Record<string, ExpandedEntry | ExpandedEntry[] | null>;
};

async function loadType(apiId: string): Promise<ContentTypeWithFields | null> {
  const [type] = await db
    .select()
    .from(contentTypes)
    .where(eq(contentTypes.apiId, apiId))
    .limit(1);

  if (!type) return null;

  const fields = await db
    .select()
    .from(contentFields)
    .where(eq(contentFields.contentTypeId, type.id))
    .orderBy(asc(contentFields.position));

  return { ...type, fields };
}

export async function getPublicTypes() {
  "use cache";
  cacheLife("hours");
  cacheTag(TYPES_TAG);

  return db
    .select({
      id: contentTypes.id,
      name: contentTypes.name,
      apiId: contentTypes.apiId,
      description: contentTypes.description,
    })
    .from(contentTypes)
    .orderBy(contentTypes.name);
}

export async function getPublicEntries(
  apiId: string,
  limit = 50,
): Promise<PublicEntry[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTag(apiId));

  const type = await loadType(apiId);
  if (!type) return [];

  const rows = await db
    .select({
      id: entries.id,
      title: entries.title,
      slug: entries.slug,
      publishedAt: entries.publishedAt,
      seoDescription: entries.seoDescription,
      seoImageId: entries.seoImageId,
      data: entries.data,
    })
    .from(entries)
    .where(
      and(
        eq(entries.contentTypeId, type.id),
        eq(entries.status, "published"),
        isNotNull(entries.publishedAt),
        lte(entries.publishedAt, new Date()),
      ),
    )
    .orderBy(desc(entries.publishedAt))
    .limit(limit);

  const resolved = await resolveRelations(type, rows, "all", {
    publishedOnly: true,
  });

  if (resolved.size === 0) return rows;

  return rows.map((row) => attachExpansion(type, row, resolved, "all"));
}

export async function getPublicEntry(
  apiId: string,
  slug: string,
): Promise<PublicEntry | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTag(apiId));

  const type = await loadType(apiId);
  if (!type) return null;

  const [entry] = await db
    .select({
      id: entries.id,
      title: entries.title,
      slug: entries.slug,
      publishedAt: entries.publishedAt,
      seoDescription: entries.seoDescription,
      seoImageId: entries.seoImageId,
      data: entries.data,
    })
    .from(entries)
    .where(
      and(
        eq(entries.contentTypeId, type.id),
        eq(entries.slug, slug),
        eq(entries.status, "published"),
        isNotNull(entries.publishedAt),
        lte(entries.publishedAt, new Date()),
      ),
    )
    .limit(1);

  if (!entry) return null;

  const resolved = await resolveRelations(type, [entry], "all", {
    publishedOnly: true,
  });

  return resolved.size === 0
    ? entry
    : attachExpansion(type, entry, resolved, "all");
}

export type PublicReference = {
  id: string;
  title: string;
  slug: string;
  typeApiId: string;
  typeName: string;
  data: Record<string, unknown>;
};

export async function getPublicReferences(
  entryId: string,
): Promise<PublicReference[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(REFERENCES_TAG);

  const relations = await db
    .select()
    .from(contentFields)
    .where(eq(contentFields.type, "relation"));

  if (relations.length === 0) return [];

  const matches = relations.map((field) =>
    and(
      eq(entries.contentTypeId, field.contentTypeId),
      sql`${entries.data} @> ${JSON.stringify(
        field.multiple ? { [field.apiKey]: [entryId] } : { [field.apiKey]: entryId },
      )}::jsonb`,
    ),
  );

  return db
    .select({
      id: entries.id,
      title: entries.title,
      slug: entries.slug,
      data: entries.data,
      typeApiId: contentTypes.apiId,
      typeName: contentTypes.name,
    })
    .from(entries)
    .innerJoin(contentTypes, eq(contentTypes.id, entries.contentTypeId))
    .where(
      and(
        or(...matches),
        eq(entries.status, "published"),
        isNotNull(entries.publishedAt),
        lte(entries.publishedAt, new Date()),
      ),
    )
    .orderBy(desc(entries.publishedAt))
    .limit(20);
}

export async function getEvents(): Promise<{
  proximos: PublicEntry[];
  pasados: PublicEntry[];
}> {
  "use cache";
  cacheLife("hours");
  cacheTag(contentTag("evento"));

  const eventos = await getPublicEntries("evento", 100);
  const hoy = new Date().toISOString().slice(0, 10);
  const fecha = (entry: PublicEntry) =>
    typeof entry.data.fecha === "string" ? entry.data.fecha : "";

  return {
    proximos: eventos
      .filter((evento) => fecha(evento) >= hoy)
      .sort((a, b) => fecha(a).localeCompare(fecha(b))),
    pasados: eventos
      .filter((evento) => fecha(evento) < hoy)
      .sort((a, b) => fecha(b).localeCompare(fecha(a))),
  };
}
