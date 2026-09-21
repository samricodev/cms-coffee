import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { vi } from "vitest";

import { db } from "@/db";
import {
  contentFields,
  contentTypes,
  users,
  type ContentField,
  type ContentTypeWithFields,
} from "@/db/schema";
import type { SessionUser } from "@/lib/auth/session";

export async function limpiarBase() {
  await db.execute(
    sql`truncate table "entries", "content_fields", "content_types", "media", "sessions", "trusted_devices", "login_attempts", "users" restart identity cascade`,
  );
}

export async function crearUsuario(
  role: "admin" | "editor" = "editor",
  email = `${role}-${crypto.randomUUID()}@test.local`,
  name = email.split("@")[0]!,
): Promise<SessionUser> {
  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash: "no-usado", role })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    });

  return user;
}

type CampoSemilla = Omit<
  Partial<ContentField>,
  "id" | "contentTypeId" | "createdAt"
> & { apiKey: string; type: ContentField["type"] };

export async function crearTipo(
  apiId: string,
  campos: CampoSemilla[] = [],
): Promise<ContentTypeWithFields> {
  const [type] = await db
    .insert(contentTypes)
    .values({ name: apiId, apiId })
    .returning();

  if (campos.length === 0) return { ...type, fields: [] };

  const fields = await db
    .insert(contentFields)
    .values(
      campos.map((campo, position) => ({
        contentTypeId: type.id,
        label: campo.label ?? campo.apiKey,
        apiKey: campo.apiKey,
        type: campo.type,
        required: campo.required ?? false,
        choices: campo.choices ?? null,
        targetTypeId: campo.targetTypeId ?? null,
        multiple: campo.multiple ?? false,
        position,
      })),
    )
    .returning();

  return { ...type, fields };
}

export function campo(
  apiKey: string,
  type: ContentField["type"],
  extra: Partial<ContentField> = {},
): ContentField {
  return {
    id: crypto.randomUUID(),
    contentTypeId: crypto.randomUUID(),
    label: apiKey,
    apiKey,
    type,
    required: false,
    position: 0,
    choices: null,
    targetTypeId: null,
    multiple: false,
    createdAt: new Date(),
    ...extra,
  };
}

/** Un navegador de mentira: guarda lo que se le pone con `set` y lo devuelve con `get`. */
export function navegador() {
  const guardadas = new Map<string, string>();

  vi.mocked(cookies).mockResolvedValue({
    get: (nombre: string) => {
      const value = guardadas.get(nombre);
      return value === undefined ? undefined : { name: nombre, value };
    },
    set: (nombre: string, value: string) => void guardadas.set(nombre, value),
    delete: (nombre: string) => void guardadas.delete(nombre),
  } as unknown as Awaited<ReturnType<typeof cookies>>);

  return guardadas;
}
