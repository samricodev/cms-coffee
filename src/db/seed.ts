import { eq } from "drizzle-orm";

import { hashPassword } from "../lib/auth/password";
import { db } from "./index";
import {
  contentFields,
  contentTypes,
  entries,
  users,
  type ContentType,
} from "./schema";

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "contrasena-de-desarrollo";

type FieldSeed = {
  label: string;
  apiKey: string;
  type: "text" | "textarea" | "number" | "boolean" | "date" | "select";
  required?: boolean;
  choices?: string[];
};

async function upsertType(
  name: string,
  apiId: string,
  description: string,
  fields: FieldSeed[],
): Promise<ContentType> {
  await db
    .insert(contentTypes)
    .values({ name, apiId, description })
    .onConflictDoNothing({ target: contentTypes.apiId });

  const [type] = await db
    .select()
    .from(contentTypes)
    .where(eq(contentTypes.apiId, apiId))
    .limit(1);

  const existing = await db
    .select({ apiKey: contentFields.apiKey })
    .from(contentFields)
    .where(eq(contentFields.contentTypeId, type.id));

  const missing = fields.filter(
    (field) => !existing.some((row) => row.apiKey === field.apiKey),
  );

  if (missing.length > 0) {
    await db.insert(contentFields).values(
      missing.map((field, index) => ({
        contentTypeId: type.id,
        label: field.label,
        apiKey: field.apiKey,
        type: field.type,
        required: field.required ?? false,
        choices: field.choices ?? null,
        position: existing.length + index,
      })),
    );
  }

  return type;
}

async function seed() {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  const [admin] = await db
    .insert(users)
    .values([
      { email: "admin@cms.local", name: "Admin", passwordHash, role: "admin" },
      { email: "editor@cms.local", name: "Editor", passwordHash, role: "editor" },
    ])
    .onConflictDoUpdate({ target: users.email, set: { passwordHash } })
    .returning();

  const articulo = await upsertType(
    "Artículo",
    "articulo",
    "Textos del blog.",
    [
      { label: "Extracto", apiKey: "excerpt", type: "text" },
      { label: "Contenido", apiKey: "body", type: "textarea" },
    ],
  );

  const producto = await upsertType(
    "Producto",
    "producto",
    "Catálogo de ejemplo.",
    [
      { label: "Precio", apiKey: "precio", type: "number", required: true },
      {
        label: "Categoría",
        apiKey: "categoria",
        type: "select",
        required: true,
        choices: ["camisetas", "tazas", "pósters"],
      },
      { label: "Disponible", apiKey: "disponible", type: "boolean" },
      { label: "Descripción", apiKey: "descripcion", type: "textarea" },
      { label: "Lanzamiento", apiKey: "lanzamiento", type: "date" },
    ],
  );

  await db
    .insert(entries)
    .values([
      {
        contentTypeId: articulo.id,
        title: "Hola, CMS",
        slug: "hola-cms",
        status: "published",
        publishedAt: new Date(),
        authorId: admin?.id,
        data: {
          excerpt: "La primera entrada guardada en Postgres.",
          body: "Estás leyendo esto desde la base de datos.",
        },
      },
      {
        contentTypeId: articulo.id,
        title: "Un borrador",
        slug: "un-borrador",
        status: "draft",
        authorId: admin?.id,
        data: {
          excerpt: "Todavía no es público.",
          body: "Los borradores no aparecen en la API pública.",
        },
      },
      {
        contentTypeId: producto.id,
        title: "Taza del CMS",
        slug: "taza-del-cms",
        status: "published",
        publishedAt: new Date(),
        authorId: admin?.id,
        data: {
          precio: 12.5,
          categoria: "tazas",
          disponible: true,
          descripcion: "Una taza con el logo del proyecto.",
          lanzamiento: "2026-09-01",
        },
      },
    ])
    .onConflictDoNothing();

  const total = await db.select().from(entries);
  console.log(`Seed completado. Entradas en la base: ${total.length}`);
  console.log("Cuentas: admin@cms.local / editor@cms.local");
  console.log(`Contraseña: ${SEED_PASSWORD}`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
