import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { and, desc, eq, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  contentFields,
  contentTypes,
  entries,
  media,
  type Media,
} from "@/db/schema";
import type { SessionUser } from "@/lib/auth/session";
import { AppError, conflict, forbidden, notFound } from "@/lib/errors";

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

function storageDir(): string {
  return path.join(process.cwd(), "storage", "media");
}

function invalid(message: string) {
  return new AppError("invalid_input", message);
}

export async function listMedia(): Promise<Media[]> {
  return db.select().from(media).orderBy(desc(media.createdAt));
}

export async function getMediaById(id: string): Promise<Media> {
  const [found] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!found) throw notFound(`No existe el archivo ${id}`);
  return found;
}

export async function readMediaBytes(item: Media): Promise<Buffer> {
  return readFile(path.join(storageDir(), item.storageKey));
}

export async function createMedia(
  file: File,
  actor: SessionUser,
): Promise<Media> {
  if (file.size === 0) throw invalid("El archivo está vacío");
  if (file.size > MAX_BYTES) throw invalid("El archivo supera los 5 MB");

  const extension = ALLOWED[file.type];
  if (!extension) throw invalid(`Tipo de archivo no permitido: ${file.type}`);

  const storageKey = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(storageDir(), { recursive: true });
  await writeFile(path.join(storageDir(), storageKey), bytes);

  const [created] = await db
    .insert(media)
    .values({
      filename: path.basename(file.name).slice(0, 200),
      mimeType: file.type,
      size: file.size,
      storageKey,
      uploadedBy: actor.id,
    })
    .returning();

  return created;
}

export type UsoDeArchivo = { id: string; title: string; typeApiId: string };

/**
 * Dónde se está usando un archivo. Hay que mirar en dos sitios: la columna
 * `seo_image_id`, que sí tiene clave foránea, y los campos de tipo archivo, que
 * viven dentro del JSONB y ahí Postgres no puede ayudar.
 */
export async function listMediaUsage(mediaId: string): Promise<UsoDeArchivo[]> {
  const camposArchivo = await db
    .select()
    .from(contentFields)
    .where(eq(contentFields.type, "media"));

  const coincidencias = camposArchivo.map((field) =>
    and(
      eq(entries.contentTypeId, field.contentTypeId),
      sql`${entries.data} @> ${JSON.stringify({ [field.apiKey]: mediaId })}::jsonb`,
    ),
  );

  return db
    .select({
      id: entries.id,
      title: entries.title,
      typeApiId: contentTypes.apiId,
    })
    .from(entries)
    .innerJoin(contentTypes, eq(contentTypes.id, entries.contentTypeId))
    .where(or(eq(entries.seoImageId, mediaId), ...coincidencias))
    .limit(20);
}

export async function deleteMedia(id: string, actor: SessionUser): Promise<void> {
  const item = await getMediaById(id);

  if (actor.role !== "admin" && item.uploadedBy !== actor.id) {
    throw forbidden("Solo puedes borrar los archivos que has subido");
  }

  const usos = await listMediaUsage(id);

  if (usos.length > 0) {
    const nombres = usos.slice(0, 3).map((uso) => `«${uso.title}»`).join(", ");
    const resto = usos.length > 3 ? ` y ${usos.length - 3} más` : "";

    throw conflict(
      `No se puede borrar: ${nombres}${resto} usa${usos.length === 1 ? "" : "n"} este archivo. Quita la imagen de esas entradas primero.`,
    );
  }

  await db.delete(media).where(eq(media.id, id));
  await unlink(path.join(storageDir(), item.storageKey)).catch(() => {});
}
