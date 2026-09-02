import { hashPassword } from "../lib/auth/password";
import { db } from "./index";
import { contentFields, contentTypes, entries, posts, users } from "./schema";

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "contrasena-de-desarrollo";

async function seed() {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  const [existing] = await db
    .insert(users)
    .values([
      {
        email: "admin@cms.local",
        name: "Admin",
        passwordHash,
        role: "admin" as const,
      },
      {
        email: "editor@cms.local",
        name: "Editor",
        passwordHash,
        role: "editor" as const,
      },
    ])
    .onConflictDoUpdate({ target: users.email, set: { passwordHash } })
    .returning();

  await db
    .insert(posts)
    .values([
      {
        title: "Hola, CMS",
        slug: "hola-cms",
        excerpt: "La primera entrada guardada en Postgres.",
        body: "Estás leyendo esto desde la base de datos.",
        status: "published",
        publishedAt: new Date(),
        authorId: existing?.id,
      },
      {
        title: "Un borrador",
        slug: "un-borrador",
        excerpt: "Todavía no es público.",
        body: "Los borradores no deben aparecer en la API pública.",
        status: "draft",
        authorId: existing?.id,
      },
    ])
    .onConflictDoNothing({ target: posts.slug });

  const [productType] = await db
    .insert(contentTypes)
    .values({
      name: "Producto",
      apiId: "producto",
      description: "Catálogo de ejemplo para probar los tipos dinámicos.",
    })
    .onConflictDoNothing({ target: contentTypes.apiId })
    .returning();

  if (productType) {
    await db.insert(contentFields).values([
      {
        contentTypeId: productType.id,
        label: "Precio",
        apiKey: "precio",
        type: "number" as const,
        required: true,
        position: 0,
      },
      {
        contentTypeId: productType.id,
        label: "Categoría",
        apiKey: "categoria",
        type: "select" as const,
        required: true,
        position: 1,
        choices: ["camisetas", "tazas", "pósters"],
      },
      {
        contentTypeId: productType.id,
        label: "Disponible",
        apiKey: "disponible",
        type: "boolean" as const,
        position: 2,
      },
      {
        contentTypeId: productType.id,
        label: "Descripción",
        apiKey: "descripcion",
        type: "textarea" as const,
        position: 3,
      },
      {
        contentTypeId: productType.id,
        label: "Lanzamiento",
        apiKey: "lanzamiento",
        type: "date" as const,
        position: 4,
      },
    ]);

    await db.insert(entries).values({
      contentTypeId: productType.id,
      title: "Taza del CMS",
      slug: "taza-del-cms",
      status: "published",
      publishedAt: new Date(),
      authorId: existing?.id,
      data: {
        precio: 12.5,
        categoria: "tazas",
        disponible: true,
        descripcion: "Una taza con el logo del proyecto.",
        lanzamiento: "2026-09-01",
      },
    });
  }

  const total = await db.query.posts.findMany();
  console.log(`Seed completado. Entradas en la base: ${total.length}`);
  console.log(`Cuentas: admin@cms.local / editor@cms.local`);
  console.log(`Contraseña: ${SEED_PASSWORD}`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
