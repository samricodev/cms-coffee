import Link from "next/link";

import { MediaImage } from "@/components/site/media-image";
import { asText, formatMoney } from "@/lib/format";
import { getPublicEntries } from "@/lib/public-content";

export const metadata = {
  title: "Carta",
  description: "Espresso, filtrados, repostería y café en grano para llevar.",
};

const CATEGORIAS: Array<[string, string]> = [
  ["espresso", "Espresso"],
  ["con leche", "Con leche"],
  ["filtrado", "Filtrados"],
  ["repostería", "Repostería"],
  ["grano", "Café en grano"],
  ["merch", "Merch"],
];

export default async function CartaPage() {
  const productos = await getPublicEntries("producto", 100);

  const grupos = CATEGORIAS.map(([categoria, titulo]) => ({
    categoria,
    titulo,
    items: productos.filter((item) => item.data.categoria === categoria),
  })).filter((grupo) => grupo.items.length > 0);

  return (
    <div className="space-y-12">
      <header className="max-w-2xl space-y-4">
        <h1 className="font-display text-5xl">Carta</h1>
        <p className="text-lg text-muted">
          Cambia con los orígenes que tenemos abiertos. Los precios incluyen
          impuestos.
        </p>
      </header>

      <div className="grid items-start gap-6 sm:grid-cols-2">
        {grupos.map((grupo) => (
          <section key={grupo.categoria} className="space-y-5 rounded-sm bg-surface p-6 sm:p-8">
            <h2 className="flex items-center gap-4 font-display text-2xl">
              {grupo.titulo}
              <span aria-hidden className="h-px flex-1 bg-line" />
            </h2>

            <ul className="space-y-5">
              {grupo.items.map((item) => {
                const cafe = item.expanded?.cafe as
                  | { slug: string; title: string }
                  | null
                  | undefined;

                return (
                  <li key={item.id} className="flex gap-4">
                    <MediaImage
                      id={item.data.foto}
                      alt={item.title}
                      className="aspect-square w-16 shrink-0 rounded-sm"
                      sizes="64px"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3">
                        <span className="font-display text-lg">{item.title}</span>
                        <span className="flex-1 border-b border-dotted border-muted/40" />
                        <span className="font-mono text-accent tabular-nums">
                          {formatMoney(item.data.precio)}
                        </span>
                      </div>

                      {asText(item.data.descripcion) ? (
                        <p className="mt-1 text-sm text-muted">
                          {asText(item.data.descripcion)}
                        </p>
                      ) : null}

                      {cafe ? (
                        <p className="mt-1.5 text-xs font-semibold">
                          <Link
                            href={`/cafes/${cafe.slug}`}
                            className="text-accent underline-offset-4 hover:underline"
                          >
                            con {cafe.title}
                          </Link>
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
