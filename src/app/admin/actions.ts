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
import {
  addField,
  createContentType,
  deleteContentType,
  deleteField,
  getContentTypeByApiId,
} from "@/lib/content-types";
import {
  createEntry,
  deleteEntry,
  entryDataSchema,
  updateEntry,
} from "@/lib/entries";
import type { ContentField } from "@/db/schema";
import { createMedia, deleteMedia } from "@/lib/media";
import {
  createContentTypeSchema,
  createFieldSchema,
  entryBaseSchema,
} from "@/lib/validation/content";
import { formValues, toFormState, type FormState } from "@/lib/form";
import { createUserSchema, loginSchema } from "@/lib/validation/auth";

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
    return toFormState(error, formValues(formData));
  }

  redirect("/admin");
}

export async function logoutAction() {
  const jar = await cookies();
  await destroySession(jar.get(SESSION_COOKIE)?.value);
  jar.delete(SESSION_COOKIE);
  redirect("/login");
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
    return toFormState(error, formValues(formData));
  }
}

function readEntryData(
  fields: ContentField[],
  formData: FormData,
): Record<string, unknown> {
  const raw: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.type === "boolean") {
      raw[field.apiKey] = formData.get(field.apiKey) !== null;
      continue;
    }

    const value = text(formData, field.apiKey).trim();
    if (value !== "") raw[field.apiKey] = value;
  }

  return raw;
}

export async function createContentTypeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  let id: string;

  try {
    await requireAdmin();

    const input = createContentTypeSchema.parse({
      name: text(formData, "name"),
      apiId: text(formData, "apiId"),
      description: text(formData, "description") || undefined,
    });

    id = (await createContentType(input)).id;
    refresh("/admin", "/admin/types");
  } catch (error) {
    return toFormState(error, formValues(formData));
  }

  redirect(`/admin/types/${id}`);
}

export async function deleteContentTypeAction(id: string) {
  await requireAdmin();
  await deleteContentType(id);
  refresh("/admin", "/admin/types");
  redirect("/admin/types");
}

export async function addFieldAction(
  contentTypeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireAdmin();

    const choices = text(formData, "choices")
      .split(",")
      .map((choice) => choice.trim())
      .filter(Boolean);

    const input = createFieldSchema.parse({
      label: text(formData, "label"),
      apiKey: text(formData, "apiKey"),
      type: text(formData, "type"),
      required: formData.get("required") !== null,
      choices,
    });

    await addField(contentTypeId, input);
    refresh("/admin/types", `/admin/types/${contentTypeId}`);
    return { status: "success", message: `Campo "${input.label}" añadido` };
  } catch (error) {
    return toFormState(error, formValues(formData));
  }
}

export async function deleteFieldAction(contentTypeId: string, fieldId: string) {
  await requireAdmin();
  await deleteField(contentTypeId, fieldId);
  refresh("/admin/types", `/admin/types/${contentTypeId}`);
}

export async function createEntryAction(
  apiId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  let id: string;

  try {
    const actor = await requireUser();
    const type = await getContentTypeByApiId(apiId);

    const slug = text(formData, "slug").trim();
    const base = entryBaseSchema.parse({
      title: text(formData, "title"),
      slug: slug === "" ? undefined : slug,
      status: text(formData, "status"),
      publishedAt: text(formData, "publishedAt"),
    });

    const data = entryDataSchema(type).parse(readEntryData(type.fields, formData));

    id = (await createEntry(type, base, data, actor)).id;
    refresh("/admin", `/admin/content/${apiId}`);
  } catch (error) {
    return toFormState(error, formValues(formData));
  }

  redirect(`/admin/content/${apiId}/${id}`);
}

export async function updateEntryAction(
  apiId: string,
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const actor = await requireUser();
    const type = await getContentTypeByApiId(apiId);

    const base = entryBaseSchema.parse({
      title: text(formData, "title"),
      slug: text(formData, "slug"),
      status: text(formData, "status"),
      publishedAt: text(formData, "publishedAt"),
    });

    const data = entryDataSchema(type).parse(readEntryData(type.fields, formData));

    await updateEntry(type, id, base, data, actor);
    refresh("/admin", `/admin/content/${apiId}`, `/admin/content/${apiId}/${id}`);
    return { status: "success", message: "Guardado" };
  } catch (error) {
    return toFormState(error, formValues(formData));
  }
}

export async function deleteEntryAction(apiId: string, id: string) {
  const actor = await requireUser();
  const type = await getContentTypeByApiId(apiId);
  await deleteEntry(type, id, actor);
  refresh("/admin", `/admin/content/${apiId}`);
  redirect(`/admin/content/${apiId}`);
}

export async function uploadMediaAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const actor = await requireUser();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return { status: "error", message: "Selecciona un archivo" };
    }

    const item = await createMedia(file, actor);
    refresh("/admin/media");
    return { status: "success", message: `Subido: ${item.filename}` };
  } catch (error) {
    return toFormState(error);
  }
}

export async function deleteMediaAction(id: string) {
  const actor = await requireUser();
  await deleteMedia(id, actor);
  refresh("/admin/media");
}
