import Link from "next/link";

import { asText, formatMoney } from "@/lib/format";
import { getPublicEntries } from "@/lib/public-content";

export const metadata = {
  title: "Carta",
  description: "Espresso, filtrados, repostería y café en grano para llevar.",
};

const ORDEN = ["espresso", "con leche", "filtrado", "repostería", "grano", "merch"];

export default async function CartaPage() {
  const productos = await getPublicEntries("producto", 100);

  const grupos = ORDEN.map((categoria) => ({
    categoria,
    items: productos.filter((item) => item.data.categoria === categoria),
  })).filter((grupo) => grupo.items.length > 0);

  return (
    <div className="space-y-12">
      <header className="max-w-2xl space-y-3">
        <h1 className="font-display text-4xl">Carta</h1>
        <p className="text-muted">
          Cambia con los orígenes que tenemos abiertos. Los precios incluyen
          impuestos.
        </p>
      </header>

      {grupos.map((grupo) => (
        <section key={grupo.categoria} className="space-y-4">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-accent">
            {grupo.categoria}
          </h2>

          <ul className="max-w-2xl divide-y divide-line border-t border-line">
            {grupo.items.map((item) => {
              const cafe = item.expanded?.cafe as
                | { slug: string; title: string }
                | null
                | undefined;

              return (
                <li key={item.id} className="py-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-lg">{item.title}</span>
                    <span className="flex-1 border-b border-dotted border-line" />
                    <span className="font-mono tabular-nums">
                      {formatMoney(item.data.precio)}
                    </span>
                  </div>

                  {asText(item.data.descripcion) ? (
                    <p className="mt-1 max-w-prose text-sm text-muted">
                      {asText(item.data.descripcion)}
                    </p>
                  ) : null}

                  {cafe ? (
                    <p className="mt-1 font-mono text-xs">
                      <Link
                        href={`/cafes/${cafe.slug}`}
                        className="text-accent underline-offset-4 hover:underline"
                      >
                        con {cafe.title}
                      </Link>
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
