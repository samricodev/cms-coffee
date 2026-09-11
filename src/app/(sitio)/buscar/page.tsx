import Link from "next/link";
import { Suspense } from "react";

import { buttonPrimary, eyebrow } from "@/components/site/ui";
import { asText } from "@/lib/format";
import { searchPublic } from "@/lib/public-content";

export const metadata = {
  title: "Buscar",
  description: "Busca cafés, artículos, productos y eventos.",
};

const RUTA: Record<string, string> = {
  cafe: "/cafes",
  articulo: "/articulos",
  pagina: "",
  producto: "/carta",
  evento: "/eventos",
};

function enlace(typeApiId: string, slug: string): string {
  const base = RUTA[typeApiId];
  if (base === undefined) return "/";
  return base === "" ? `/${slug}` : `${base}/${slug}`;
}

async function Resultados({
  searchParams,
}: {
  searchParams: PageProps<"/buscar">["searchParams"];
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const hits = await searchPublic(q);

  return (
    <>
      <form className="flex max-w-xl gap-3 rounded-sm bg-surface p-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="jazmín, natural, V60…"
          aria-label="Buscar"
          className="min-w-0 flex-1 rounded-full border border-field bg-white px-4 py-2 hover:border-ink/60 focus:border-accent"
        />
        <button type="submit" className={buttonPrimary}>
          Buscar
        </button>
      </form>

      {q === "" ? (
        <p className="text-muted">
          Busca por nota de cata, origen, método o cualquier palabra del texto.
        </p>
      ) : hits.length === 0 ? (
        <p className="text-muted">
          Nada coincide con <strong>{q}</strong>.
        </p>
      ) : (
        <ul className="space-y-6">
          {hits.map((hit) => (
            <li key={hit.id} className="space-y-1.5 border-t border-line pt-5">
              <p className={`${eyebrow} text-accent`}>
                {hit.typeName}
              </p>
              <h2 className="font-display text-2xl leading-tight">
                <Link
                  href={enlace(hit.typeApiId, hit.slug)}
                  className="hover:text-accent"
                >
                  {hit.title}
                </Link>
              </h2>
              <p className="max-w-prose text-sm text-muted">
                {asText(hit.data.excerpt) ||
                  asText(hit.data.descripcion) ||
                  (Array.isArray(hit.data.notas)
                    ? hit.data.notas.join(" · ")
                    : "")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function BuscarPage({ searchParams }: PageProps<"/buscar">) {
  return (
    <div className="space-y-8">
      <header className="max-w-2xl space-y-3">
        <h1 className="font-display text-5xl">Buscar</h1>
      </header>

      <Suspense fallback={<p className="py-10 text-muted">Buscando…</p>}>
        <Resultados searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
