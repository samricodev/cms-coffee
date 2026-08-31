import { db } from "./index";
import { posts, users } from "./schema";

async function seed() {
  const [author] = await db
    .insert(users)
    .values({
      email: "admin@cms.local",
      name: "Admin",
      passwordHash: "PENDIENTE_FASE_3",
      role: "admin",
    })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const existing = author ?? (await db.query.users.findFirst());

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

  const total = await db.query.posts.findMany();
  console.log(`Seed completado. Entradas en la base: ${total.length}`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
