import Link from "next/link";
import { notFound } from "next/navigation";

import { card, input, primary, secondary } from "@/components/ui";
import { requireUser } from "@/lib/auth/guards";
import { getContentTypeByApiId } from "@/lib/content-types";
import { listEntries } from "@/lib/entries";
import { AppError } from "@/lib/errors";
import { listEntriesQuerySchema } from "@/lib/validation/content";

export default async function EntriesPage({
  params,
  searchParams,
}: PageProps<"/admin/content/[type]">) {
  const user = await requireUser();
  const { type: apiId } = await params;

  const type = await getContentTypeByApiId(apiId).catch((error) => {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  });

  const query = listEntriesQuerySchema.parse(await searchParams);
  const { items, pagination } = await listEntries(type, query);

  const pageLink = (page: number) => {
    const search = new URLSearchParams();
    if (query.q) search.set("q", query.q);
    if (query.status) search.set("status", query.status);
    search.set("page", String(page));
    return `/admin/content/${apiId}?${search}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{type.name}</h1>
        <Link href={`/admin/content/${apiId}/new`} className={`${primary} ml-auto`}>
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
          No hay entradas de tipo {type.name}.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((entry) => {
            const mine = entry.authorId === user.id || user.role === "admin";

            return (
              <li key={entry.id} className={card}>
                <div className="flex flex-wrap items-baseline gap-2">
                  <Link
                    href={`/admin/content/${apiId}/${entry.id}`}
                    className="font-medium hover:underline"
                  >
                    {entry.title}
                  </Link>
                  <span className="rounded bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                    {entry.status === "published" ? "publicada" : "borrador"}
                  </span>
                  {!mine ? (
                    <span className="text-xs text-black/50 dark:text-white/50">
                      solo lectura
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-black/60 dark:text-white/60">
                  /{entry.slug} · {entry.authorName ?? "sin autor"}
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
            Página {pagination.page} de {pagination.totalPages} · {pagination.total}{" "}
            entradas
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
