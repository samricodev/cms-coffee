import { hashPassword } from "../lib/auth/password";
import { db } from "./index";
import { posts, users } from "./schema";

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
