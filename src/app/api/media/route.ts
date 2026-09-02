import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/guards";
import { errorResponse } from "@/lib/http";
import { listMedia } from "@/lib/media";

export async function GET() {
  try {
    await requireUser();
    const items = await listMedia();

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        filename: item.filename,
        mimeType: item.mimeType,
        size: item.size,
        url: `/api/media/${item.id}`,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
