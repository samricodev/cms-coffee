import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/guards";
import { badRequest, errorResponse, readJson, unprocessable } from "@/lib/http";
import { getContentTypeByApiId } from "@/lib/content-types";
import { createEntry, entryDataSchema, listEntries } from "@/lib/entries";
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

    const params = Object.fromEntries(new URL(request.url).searchParams);
    const query = listEntriesQuerySchema.parse(params);

    return NextResponse.json(await listEntries(type, query));
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
