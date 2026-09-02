import { NextResponse } from "next/server";

import { badRequest, errorResponse, readJson, unprocessable } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/guards";
import { createUser, listUsers } from "@/lib/users";
import { createUserSchema } from "@/lib/validation/auth";

// GET /api/users
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ items: await listUsers() });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/users
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const payload = await readJson(request);
    if (payload === undefined) return badRequest("El cuerpo no es JSON válido");

    const parsed = createUserSchema.safeParse(payload);
    if (!parsed.success) return unprocessable(parsed.error);

    const user = await createUser(parsed.data);
    return NextResponse.json(user, {
      status: 201,
      headers: { Location: `/api/users/${user.id}` },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
