import Link from "next/link";

import { card, primary, secondary } from "@/components/ui";
import { requireUser } from "@/lib/auth/guards";
import { listContentTypeSummaries } from "@/lib/content-types";

export const instant = false;

export default async function AdminHomePage() {
  const user = await requireUser();
  const types = await listContentTypeSummaries();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted">Hola, {user.name}</p>
          <h1 className="font-display text-3xl">Contenido</h1>
        </div>
        {user.role === "admin" ? (
          <Link href="/admin/types" className={`${secondary} ml-auto`}>
            Gestionar tipos
          </Link>
        ) : null}
      </div>

      {types.length === 0 ? (
        <p className={`${card} text-sm text-muted`}>
          No hay ningún tipo de contenido definido todavía.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {types.map((type) => (
            <li key={type.id} className={`${card} flex flex-col gap-4`}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/content/${type.apiId}`}
                    className="font-display text-xl hover:text-accent"
                  >
                    {type.name}
                  </Link>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted">
                    /api/public/{type.apiId}
                  </p>
                </div>
                <Link href={`/admin/content/${type.apiId}/new`} className={primary}>
                  Nueva
                </Link>
              </div>

              <dl className="grid grid-cols-3 gap-2 border-t border-line pt-4">
                <Stat label="Entradas" value={type.entryCount} />
                <Stat label="Publicadas" value={type.publishedCount} />
                <Stat label="Campos" value={type.fieldCount} />
              </dl>

              {type.description ? (
                <p className="text-sm text-muted">{type.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-display text-2xl tabular-nums">{value}</dd>
    </div>
  );
}
