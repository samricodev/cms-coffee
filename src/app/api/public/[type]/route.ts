import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/http";
import { notFound } from "@/lib/errors";
import { getPublicEntries, getPublicTypes } from "@/lib/public-content";

const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=300";

export async function GET(
  _request: Request,
  context: { params: Promise<{ type: string }> },
) {
  try {
    const { type: apiId } = await context.params;
    const types = await getPublicTypes();

    if (!types.some((type) => type.apiId === apiId)) {
      throw notFound(`No existe el tipo de contenido "${apiId}"`);
    }

    return NextResponse.json(
      { items: await getPublicEntries(apiId) },
      { headers: { "Cache-Control": PUBLIC_CACHE } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
