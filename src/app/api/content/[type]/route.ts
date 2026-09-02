import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/guards";
import { badRequest, errorResponse, readJson, unprocessable } from "@/lib/http";
import { getContentTypeByApiId } from "@/lib/content-types";
import { createEntry, entryDataSchema, listEntries } from "@/lib/entries";
import { attachExpansion, parseExpand, resolveRelations } from "@/lib/relations";
import {
  entryBaseSchema,
  listEntriesQuerySchema,
} from "@/lib/validation/content";

type Context = { params: Promise<{ type: string }> };

export async function GET(request: Request, context: Context) {
  try {
    await requireUser();
    const { type: apiId } = await context.params;
    const type = await getContentTypeByApiId(apiId);

    const url = new URL(request.url);
    const query = listEntriesQuerySchema.parse(
      Object.fromEntries(url.searchParams),
    );

    const page = await listEntries(type, query);
    const expand = parseExpand(url.searchParams.get("expand"));

    if (!expand) return NextResponse.json(page);

    const resolved = await resolveRelations(type, page.items, expand);

    return NextResponse.json({
      ...page,
      items: page.items.map((item) => attachExpansion(type, item, resolved, expand)),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const actor = await requireUser();
    const { type: apiId } = await context.params;
    const type = await getContentTypeByApiId(apiId);

    const payload = await readJson(request);
    if (payload === undefined) return badRequest("El cuerpo no es JSON válido");

    const base = entryBaseSchema.safeParse(payload);
    if (!base.success) return unprocessable(base.error);

    const data = entryDataSchema(type).safeParse(
      (payload as { data?: unknown }).data ?? {},
    );
    if (!data.success) return unprocessable(data.error);

    const entry = await createEntry(type, base.data, data.data, actor);
    return NextResponse.json(entry, {
      status: 201,
      headers: { Location: `/api/content/${type.apiId}/${entry.id}` },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
