import { and, desc, eq, isNotNull, lte } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { contentTypes, entries } from "@/db/schema";

export const contentTag = (apiId: string) => `content:${apiId}`;
export const TYPES_TAG = "content-types";

export type PublicEntry = {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  data: Record<string, unknown>;
};

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

  const [type] = await db
    .select({ id: contentTypes.id })
    .from(contentTypes)
    .where(eq(contentTypes.apiId, apiId))
    .limit(1);

  if (!type) return [];

  return db
    .select({
      id: entries.id,
      title: entries.title,
      slug: entries.slug,
      publishedAt: entries.publishedAt,
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
}

export async function getPublicEntry(
  apiId: string,
  slug: string,
): Promise<PublicEntry | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(contentTag(apiId));

  const [type] = await db
    .select({ id: contentTypes.id })
    .from(contentTypes)
    .where(eq(contentTypes.apiId, apiId))
    .limit(1);

  if (!type) return null;

  const [entry] = await db
    .select({
      id: entries.id,
      title: entries.title,
      slug: entries.slug,
      publishedAt: entries.publishedAt,
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

  return entry ?? null;
}
