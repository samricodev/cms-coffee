import { z } from "zod";

import { badRequest, errorResponse } from "@/lib/http";
import { getMediaById, readMediaBytes } from "@/lib/media";

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
