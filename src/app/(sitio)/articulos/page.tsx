import Link from "next/link";

import { MediaImage } from "@/components/site/media-image";
import { asText, formatDate } from "@/lib/format";
import { getPublicEntries } from "@/lib/public-content";

export const metadata = {
  title: "Diario",
  description: "Guías de preparación, notas de origen y novedades de la barra.",
};

export default async function ArticulosPage() {
  const articulos = await getPublicEntries("articulo", 50);

  return (
    <div className="space-y-10">
      <header className="max-w-2xl space-y-3">
        <h1 className="font-display text-4xl">Diario</h1>
        <p className="text-muted">
          Recetas, orígenes y lo que va cambiando en la barra.
        </p>
      </header>

      <ul className="space-y-8">
        {articulos.map((articulo) => (
          <li
            key={articulo.id}
            className={`grid gap-4 border-t border-line pt-6 ${
              typeof articulo.data.portada === "string"
                ? "sm:grid-cols-[1fr_3fr]"
                : ""
            }`}
          >
            <MediaImage
              id={articulo.data.portada}
              alt={articulo.title}
              className="aspect-4/3 w-full"
              sizes="(max-width: 640px) 100vw, 25vw"
            />

            <div className="space-y-2">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-accent">
                {[asText(articulo.data.seccion), formatDate(articulo.publishedAt)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <h2 className="font-display text-2xl leading-tight">
                <Link
                  href={`/articulos/${articulo.slug}`}
                  className="hover:text-accent"
                >
                  {articulo.title}
                </Link>
              </h2>
              <p className="max-w-prose text-muted">
                {asText(articulo.data.excerpt)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
