import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { badRequest, errorResponse, readJson, unprocessable } from "@/lib/http";
import { getMediaById, readMediaBytes, updateMediaAlt } from "@/lib/media";
import { mediaAltSchema } from "@/lib/validation/media";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return badRequest("El id debe ser un UUID");

    const item = await getMediaById(id);
    const bytes = await readMediaBytes(item);

    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": item.mimeType,
        "Content-Length": String(item.size),
        "Content-Disposition": `inline; filename="${encodeURIComponent(item.filename)}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();

    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return badRequest("El id debe ser un UUID");

    const payload = await readJson(request);
    if (payload === undefined) return badRequest("El cuerpo no es JSON válido");

    const alt = mediaAltSchema.safeParse((payload as { alt?: unknown }).alt ?? "");
    if (!alt.success) return unprocessable(alt.error);

    const item = await updateMediaAlt(id, alt.data);

    return NextResponse.json({ id: item.id, alt: item.alt });
  } catch (error) {
    return errorResponse(error);
  }
}
