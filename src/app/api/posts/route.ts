import { NextResponse } from "next/server";

import { createPost, listPosts } from "@/lib/posts";
import { badRequest, errorResponse, readJson, unprocessable } from "@/lib/http";
import {
  createPostSchema,
  listPostsQuerySchema,
} from "@/lib/validation/post";

export async function GET(request: Request) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const query = listPostsQuerySchema.parse(params);
    return NextResponse.json(await listPosts(query));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readJson(request);
    if (payload === undefined) return badRequest("El cuerpo no es JSON válido");

    const parsed = createPostSchema.safeParse(payload);
    if (!parsed.success) return unprocessable(parsed.error);

    const post = await createPost(parsed.data);

    return NextResponse.json(post, {
      status: 201,
      headers: { Location: `/api/posts/${post.id}` },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
