import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/http";
import { SESSION_COOKIE, destroySession } from "@/lib/auth/session";

export async function POST() {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;

    await destroySession(token);

    const response = new NextResponse(null, { status: 204 });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
