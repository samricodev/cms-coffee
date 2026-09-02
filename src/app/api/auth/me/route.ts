import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/http";
import { requireUser } from "@/lib/auth/guards";

export async function GET() {
  try {
    return NextResponse.json({ user: await requireUser() });
  } catch (error) {
    return errorResponse(error);
  }
}
