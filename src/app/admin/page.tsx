import Link from "next/link";

import { requireUser } from "@/lib/auth/guards";
import { listPosts } from "@/lib/posts";
import { listPostsQuerySchema } from "@/lib/validation/post";
import { card, input, primary, secondary } from "@/components/ui";

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(value);
}

export default async function AdminPostsPage({
  searchParams,
}: PageProps<"/admin">) {
  const user = await requireUser();
  const query = listPostsQuerySchema.parse(await searchParams);
  const { items, pagination } = await listPosts(query);

  const pageLink = (page: number) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.status) params.set("status", query.status);
    params.set("page", String(page));
    return `/admin?${params}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Contenido</h1>
        <Link href="/admin/posts/new" className={`${primary} ml-auto`}>
          Nueva entrada
        </Link>
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          className={`${input} max-w-xs`}
          name="q"
          placeholder="Buscar…"
          defaultValue={query.q ?? ""}
        />
        <select
          className={`${input} max-w-40`}
          name="status"
          defaultValue={query.status ?? ""}
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borradores</option>
          <option value="published">Publicadas</option>
        </select>
        <button type="submit" className={secondary}>
          Filtrar
        </button>
      </form>

      {items.length === 0 ? (
        <p className={`${card} text-sm text-black/60 dark:text-white/60`}>
          No hay entradas que coincidan.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((post) => {
            const mine = post.authorId === user.id || user.role === "admin";

            return (
              <li key={post.id} className={card}>
                <div className="flex flex-wrap items-baseline gap-2">
                  <Link
                    href={`/admin/posts/${post.id}`}
                    className="font-medium hover:underline"
                  >
                    {post.title}
                  </Link>
                  <span className="rounded bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                    {post.status === "published" ? "publicada" : "borrador"}
                  </span>
                  {!mine ? (
                    <span className="text-xs text-black/50 dark:text-white/50">
                      solo lectura
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-black/60 dark:text-white/60">
                  /{post.slug} · {post.authorName ?? "sin autor"} ·{" "}
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {pagination.totalPages > 1 ? (
        <div className="flex items-center gap-3 text-sm">
          {pagination.page > 1 ? (
            <Link className={secondary} href={pageLink(pagination.page - 1)}>
              Anterior
            </Link>
          ) : null}
          <span className="text-black/60 dark:text-white/60">
            Página {pagination.page} de {pagination.totalPages} ·{" "}
            {pagination.total} entradas
          </span>
          {pagination.page < pagination.totalPages ? (
            <Link className={secondary} href={pageLink(pagination.page + 1)}>
              Siguiente
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
