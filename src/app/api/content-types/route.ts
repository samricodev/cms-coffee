import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/guards";
import { errorResponse } from "@/lib/http";
import { listContentTypes } from "@/lib/content-types";

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json({ items: await listContentTypes() });
  } catch (error) {
    return errorResponse(error);
  }
}
