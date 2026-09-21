import { NextResponse } from "next/server";

import { badRequest, errorResponse, readJson, unprocessable } from "@/lib/http";
import { iniciarSesion } from "@/lib/auth/login";
import { loginSchema } from "@/lib/validation/auth";

// POST /api/auth/login
export async function POST(request: Request) {
  try {
    const payload = await readJson(request);
    if (payload === undefined) return badRequest("El cuerpo no es JSON válido");

    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) return unprocessable(parsed.error);

    const user = await iniciarSesion(parsed.data);

    return NextResponse.json({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
