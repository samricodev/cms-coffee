"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  SESSION_COOKIE,
  createSession,
  destroySession,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { authenticate, createUser } from "@/lib/users";
import { createPost, deletePost, updatePost } from "@/lib/posts";
import { toFormState, type FormState } from "@/lib/form";
import { createUserSchema, loginSchema } from "@/lib/validation/auth";
import { createPostSchema, updatePostSchema } from "@/lib/validation/post";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function refresh(...paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const input = loginSchema.parse({
      email: text(formData, "email"),
      password: text(formData, "password"),
    });

    const user = await authenticate(input);
    const { token, expiresAt } = await createSession(user.id);
    (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  } catch (error) {
    return toFormState(error);
  }

  redirect("/admin");
}

export async function logoutAction() {
  const jar = await cookies();
  await destroySession(jar.get(SESSION_COOKIE)?.value);
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function createPostAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  let id: string;

  try {
    const actor = await requireUser();
    const slug = text(formData, "slug").trim();

    const input = createPostSchema.parse({
      title: text(formData, "title"),
      slug: slug === "" ? undefined : slug,
      excerpt: text(formData, "excerpt") || null,
      body: text(formData, "body"),
      status: text(formData, "status"),
    });

    id = (await createPost(input, actor)).id;
    refresh("/admin", "/");
  } catch (error) {
    return toFormState(error);
  }

  redirect(`/admin/posts/${id}`);
}

export async function updatePostAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const actor = await requireUser();

    const input = updatePostSchema.parse({
      title: text(formData, "title"),
      slug: text(formData, "slug"),
      excerpt: text(formData, "excerpt") || null,
      body: text(formData, "body"),
      status: text(formData, "status"),
    });

    await updatePost(id, input, actor);
    refresh("/admin", `/admin/posts/${id}`, "/");
    return { status: "success", message: "Guardado" };
  } catch (error) {
    return toFormState(error);
  }
}

export async function deletePostAction(id: string) {
  const actor = await requireUser();
  await deletePost(id, actor);
  refresh("/admin", "/");
  redirect("/admin");
}

export async function createUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireAdmin();

    const input = createUserSchema.parse({
      email: text(formData, "email"),
      name: text(formData, "name"),
      password: text(formData, "password"),
      role: text(formData, "role"),
    });

    await createUser(input);
    refresh("/admin/users");
    return { status: "success", message: `Cuenta creada para ${input.email}` };
  } catch (error) {
    return toFormState(error);
  }
}
