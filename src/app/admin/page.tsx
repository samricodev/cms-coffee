import Link from "next/link";

import { card, primary, secondary } from "@/components/ui";
import { requireUser } from "@/lib/auth/guards";
import { listContentTypeSummaries } from "@/lib/content-types";

export const instant = false;

export default async function AdminHomePage() {
  const user = await requireUser();
  const types = await listContentTypeSummaries();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Contenido</h1>
        {user.role === "admin" ? (
          <Link href="/admin/types" className={`${secondary} ml-auto`}>
            Gestionar tipos
          </Link>
        ) : null}
      </div>

      {types.length === 0 ? (
        <p className={`${card} text-sm text-black/60 dark:text-white/60`}>
          No hay ningún tipo de contenido definido todavía.
        </p>
      ) : (
        <ul className="space-y-3">
          {types.map((type) => (
            <li key={type.id} className={`${card} space-y-2`}>
              <div className="flex flex-wrap items-baseline gap-2">
                <Link
                  href={`/admin/content/${type.apiId}`}
                  className="font-medium hover:underline"
                >
                  {type.name}
                </Link>
                <code className="text-xs text-black/60 dark:text-white/60">
                  /api/public/{type.apiId}
                </code>
                <Link
                  href={`/admin/content/${type.apiId}/new`}
                  className={`${primary} ml-auto`}
                >
                  Nueva
                </Link>
              </div>
              <p className="text-xs text-black/60 dark:text-white/60">
                {type.entryCount} entradas · {type.publishedCount} publicadas ·{" "}
                {type.fieldCount} campos
                {type.description ? ` · ${type.description}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
