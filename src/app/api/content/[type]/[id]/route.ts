import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { badRequest, errorResponse, readJson, unprocessable } from "@/lib/http";
import { getContentTypeByApiId } from "@/lib/content-types";
import {
  deleteEntry,
  entryDataSchema,
  getEntry,
  updateEntry,
} from "@/lib/entries";
import { attachExpansion, parseExpand, resolveRelations } from "@/lib/relations";
import { updateEntryBaseSchema } from "@/lib/validation/content";

type Context = { params: Promise<{ type: string; id: string }> };

const idSchema = z.uuid();

export async function GET(request: Request, context: Context) {
  try {
    await requireUser();
    const { type: apiId, id } = await context.params;
    if (!idSchema.safeParse(id).success) return badRequest("El id debe ser un UUID");

    const type = await getContentTypeByApiId(apiId);
    const entry = await getEntry(type, id);

    const expand = parseExpand(new URL(request.url).searchParams.get("expand"));
    if (!expand) return NextResponse.json(entry);

    const resolved = await resolveRelations(type, [entry], expand);
    return NextResponse.json(attachExpansion(type, entry, resolved, expand));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const actor = await requireUser();
    const { type: apiId, id } = await context.params;
    if (!idSchema.safeParse(id).success) return badRequest("El id debe ser un UUID");

    const type = await getContentTypeByApiId(apiId);
    const current = await getEntry(type, id);

    const payload = await readJson(request);
    if (payload === undefined) return badRequest("El cuerpo no es JSON válido");

    const base = updateEntryBaseSchema.safeParse(payload);
    if (!base.success) return unprocessable(base.error);

    const incoming = (payload as { data?: Record<string, unknown> }).data;
    const merged = { ...current.data, ...(incoming ?? {}) };

    const data = entryDataSchema(type).safeParse(merged);
    if (!data.success) return unprocessable(data.error);

    return NextResponse.json(
      await updateEntry(type, id, base.data, data.data, actor),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const actor = await requireUser();
    const { type: apiId, id } = await context.params;
    if (!idSchema.safeParse(id).success) return badRequest("El id debe ser un UUID");

    const type = await getContentTypeByApiId(apiId);
    await deleteEntry(type, id, actor);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
