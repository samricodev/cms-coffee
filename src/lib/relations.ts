import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { entries, type ContentTypeWithFields, type Entry } from "@/db/schema";

export type ExpandedEntry = {
  id: string;
  title: string;
  slug: string;
  status: Entry["status"];
  data: Record<string, unknown>;
};

export type ExpandKeys = string[] | "all";

export function idsFrom(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  return [];
}

export function parseExpand(param: string | null): ExpandKeys | null {
  if (!param) return null;
  if (param === "*" || param === "all" || param === "true") return "all";

  const keys = param
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  return keys.length > 0 ? keys : null;
}

function wanted(type: ContentTypeWithFields, keys: ExpandKeys) {
  return type.fields.filter(
    (field) =>
      field.type === "relation" && (keys === "all" || keys.includes(field.apiKey)),
  );
}

export async function resolveRelations(
  type: ContentTypeWithFields,
  rows: Pick<Entry, "data">[],
  keys: ExpandKeys,
  options: { publishedOnly?: boolean } = {},
): Promise<Map<string, ExpandedEntry>> {
  const fields = wanted(type, keys);
  if (fields.length === 0) return new Map();

  const ids = [
    ...new Set(
      rows.flatMap((row) =>
        fields.flatMap((field) => idsFrom(row.data[field.apiKey])),
      ),
    ),
  ];

  if (ids.length === 0) return new Map();

  const found = await db
    .select({
      id: entries.id,
      title: entries.title,
      slug: entries.slug,
      status: entries.status,
      data: entries.data,
    })
    .from(entries)
    .where(
      options.publishedOnly
        ? and(inArray(entries.id, ids), eq(entries.status, "published"))
        : inArray(entries.id, ids),
    );

  return new Map(found.map((row) => [row.id, row]));
}

export function attachExpansion<T extends { data: Record<string, unknown> }>(
  type: ContentTypeWithFields,
  row: T,
  resolved: Map<string, ExpandedEntry>,
  keys: ExpandKeys,
): T & { expanded: Record<string, ExpandedEntry | ExpandedEntry[] | null> } {
  const expanded: Record<string, ExpandedEntry | ExpandedEntry[] | null> = {};

  for (const field of wanted(type, keys)) {
    const ids = idsFrom(row.data[field.apiKey]);

    expanded[field.apiKey] = field.multiple
      ? ids
          .map((id) => resolved.get(id))
          .filter((item): item is ExpandedEntry => item !== undefined)
      : (resolved.get(ids[0] ?? "") ?? null);
  }

  return { ...row, expanded };
}

export type RelationOption = {
  id: string;
  title: string;
  status: Entry["status"];
};

export async function listRelationOptions(
  type: ContentTypeWithFields,
): Promise<Record<string, RelationOption[]>> {
  const fields = type.fields.filter(
    (field) => field.type === "relation" && field.targetTypeId,
  );

  if (fields.length === 0) return {};

  const targetIds = [...new Set(fields.map((field) => field.targetTypeId!))];

  const rows = await db
    .select({
      id: entries.id,
      title: entries.title,
      status: entries.status,
      contentTypeId: entries.contentTypeId,
    })
    .from(entries)
    .where(inArray(entries.contentTypeId, targetIds))
    .orderBy(asc(entries.title))
    .limit(500);

  const options: Record<string, RelationOption[]> = {};

  for (const field of fields) {
    options[field.apiKey] = rows
      .filter((row) => row.contentTypeId === field.targetTypeId)
      .map(({ id, title, status }) => ({ id, title, status }));
  }

  return options;
}
