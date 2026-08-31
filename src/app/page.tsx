import { desc } from "drizzle-orm";

import { db } from "@/db";
import { posts } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function Home() {
  const rows = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt));

  return (
    <main className="mx-auto max-w-2xl p-10 font-sans">
      <h1 className="text-2xl font-semibold">CMS</h1>
      <p className="mt-2 text-sm text-gray-500">
        Contenido leído directamente de Postgres ({rows.length} entradas).
      </p>

      <ul className="mt-8 space-y-4">
        {rows.map((post) => (
          <li key={post.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <h2 className="font-medium">{post.title}</h2>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {post.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">/{post.slug}</p>
            {post.excerpt ? (
              <p className="mt-2 text-sm">{post.excerpt}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
