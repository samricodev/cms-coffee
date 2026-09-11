import Link from "next/link";

import { MediaImage } from "@/components/site/media-image";
import { arrowLink, eyebrow } from "@/components/site/ui";
import { asText, formatDate } from "@/lib/format";
import { getPublicEntries } from "@/lib/public-content";

export const metadata = {
  title: "Diario",
  description: "Guías de preparación, notas de origen y novedades de la barra.",
};

export default async function ArticulosPage() {
  const articulos = await getPublicEntries("articulo", 50);

  return (
    <div className="space-y-12">
      <header className="max-w-2xl space-y-4">
        <h1 className="font-display text-5xl">Diario</h1>
        <p className="text-lg text-muted">
          Recetas, orígenes y lo que va cambiando en la barra.
        </p>
      </header>

      <ul className="space-y-12">
        {articulos.map((articulo) => (
          <li
            key={articulo.id}
            className="grid gap-4 border-t border-line pt-8 sm:grid-cols-[11rem_1fr] sm:gap-10"
          >
            <div className="space-y-1.5">
              {asText(articulo.data.seccion) ? (
                <p className={`${eyebrow} text-accent`}>{asText(articulo.data.seccion)}</p>
              ) : null}
              <p className="text-sm text-muted">{formatDate(articulo.publishedAt)}</p>
            </div>

            <div className="space-y-3">
              <MediaImage
                id={articulo.data.portada}
                alt={articulo.title}
                className="aspect-video w-full rounded-sm"
                sizes="(max-width: 640px) 100vw, 45rem"
              />
              <h2 className="font-display text-3xl leading-tight">
                <Link href={`/articulos/${articulo.slug}`} className="hover:text-accent">
                  {articulo.title}
                </Link>
              </h2>
              <p className="max-w-prose text-lg text-muted">
                {asText(articulo.data.excerpt)}
              </p>
              <Link href={`/articulos/${articulo.slug}`} className={arrowLink}>
                Leer <span aria-hidden>→</span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
