import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/http";
import { notFound } from "@/lib/errors";
import { getPublicEntry } from "@/lib/public-content";

const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=300";

export async function GET(
  _request: Request,
  context: { params: Promise<{ type: string; slug: string }> },
) {
  try {
    const { type: apiId, slug } = await context.params;
    const entry = await getPublicEntry(apiId, slug);

    if (!entry) throw notFound(`No hay contenido publicado en "${apiId}/${slug}"`);

    return NextResponse.json(entry, {
      headers: { "Cache-Control": PUBLIC_CACHE },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
