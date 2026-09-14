import { NextResponse } from "next/server";

import type { Media } from "@/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { badRequest, errorResponse } from "@/lib/http";
import { createMedia, listMedia } from "@/lib/media";

function toJson(item: Media) {
  return {
    id: item.id,
    filename: item.filename,
    mimeType: item.mimeType,
    size: item.size,
    alt: item.alt,
    url: `/api/media/${item.id}`,
  };
}

export async function GET() {
  try {
    await requireUser();
    const items = await listMedia();

    return NextResponse.json({ items: items.map(toJson) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireUser();

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return badRequest("Envía el archivo como multipart/form-data en el campo «file»");
    }

    const item = await createMedia(file, actor);

    return NextResponse.json(toJson(item), {
      status: 201,
      headers: { Location: `/api/media/${item.id}` },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
