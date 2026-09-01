import { NextResponse } from "next/server";
import { z } from "zod";

import { deletePost, getPostById, updatePost } from "@/lib/posts";
import { badRequest, errorResponse, readJson, unprocessable } from "@/lib/http";
import { updatePostSchema } from "@/lib/validation/post";

type Context = { params: Promise<{ id: string }> };

const idSchema = z.uuid();

async function readId(context: Context) {
  const { id } = await context.params;
  return idSchema.safeParse(id);
}

export async function GET(_request: Request, context: Context) {
  try {
    const id = await readId(context);
    if (!id.success) return badRequest("El id debe ser un UUID");

    return NextResponse.json(await getPostById(id.data));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const id = await readId(context);
    if (!id.success) return badRequest("El id debe ser un UUID");

    const payload = await readJson(request);
    if (payload === undefined) return badRequest("El cuerpo no es JSON válido");

    const parsed = updatePostSchema.safeParse(payload);
    if (!parsed.success) return unprocessable(parsed.error);

    return NextResponse.json(await updatePost(id.data, parsed.data));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const id = await readId(context);
    if (!id.success) return badRequest("El id debe ser un UUID");

    await deletePost(id.data);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
