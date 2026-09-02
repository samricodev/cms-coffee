import Link from "next/link";

import { ContentTypeForm } from "@/components/content-type-form";
import { Forbidden } from "@/components/forbidden";
import { card } from "@/components/ui";
import { requireUser } from "@/lib/auth/guards";
import { listContentTypes } from "@/lib/content-types";

export default async function ContentTypesPage() {
  const actor = await requireUser();

  if (actor.role !== "admin") {
    return <Forbidden message="Modelar tipos de contenido es solo para administradores." />;
  }

  const types = await listContentTypes();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Tipos de contenido</h1>

      {types.length === 0 ? (
        <p className={`${card} text-sm text-black/60 dark:text-white/60`}>
          Todavía no hay ningún tipo definido.
        </p>
      ) : (
        <ul className="space-y-3">
          {types.map((type) => (
            <li key={type.id} className={card}>
              <div className="flex flex-wrap items-baseline gap-2">
                <Link
                  href={`/admin/types/${type.id}`}
                  className="font-medium hover:underline"
                >
                  {type.name}
                </Link>
                <code className="text-xs text-black/60 dark:text-white/60">
                  {type.apiId}
                </code>
                <Link
                  href={`/admin/content/${type.apiId}`}
                  className="ml-auto text-sm hover:underline"
                >
                  Ver contenido →
                </Link>
              </div>
              <p className="mt-1 text-xs text-black/60 dark:text-white/60">
                {type.fields.length} campos
                {type.description ? ` · ${type.description}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      <section className={`${card} space-y-4`}>
        <h2 className="font-medium">Nuevo tipo</h2>
        <ContentTypeForm />
      </section>
    </div>
  );
}
