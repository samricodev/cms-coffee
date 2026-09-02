import Link from "next/link";
import { Suspense } from "react";

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
      <form className="flex max-w-xl gap-3 border-y border-line py-5">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="jazmín, natural, V60…"
          aria-label="Buscar"
          className="flex-1 border border-line bg-transparent px-3 py-2 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="border border-ink px-4 font-mono text-[0.65rem] uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-paper"
        >
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
        <ul className="space-y-5">
          {hits.map((hit) => (
            <li key={hit.id} className="border-t border-line pt-4">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-accent">
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
        <h1 className="font-display text-4xl">Buscar</h1>
      </header>

      <Suspense fallback={<p className="py-10 text-muted">Buscando…</p>}>
        <Resultados searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
