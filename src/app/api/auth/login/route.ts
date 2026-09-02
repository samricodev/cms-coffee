import { NextResponse } from "next/server";

import { badRequest, errorResponse, readJson, unprocessable } from "@/lib/http";
import {
  SESSION_COOKIE,
  createSession,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { authenticate } from "@/lib/users";
import { loginSchema } from "@/lib/validation/auth";

// POST /api/auth/login
export async function POST(request: Request) {
  try {
    const payload = await readJson(request);
    if (payload === undefined) return badRequest("El cuerpo no es JSON válido");

    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) return unprocessable(parsed.error);

    const user = await authenticate(parsed.data);
    const { token, expiresAt } = await createSession(user.id);

    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
