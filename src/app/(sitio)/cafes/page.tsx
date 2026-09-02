import Link from "next/link";

import { MediaImage } from "@/components/site/media-image";
import { asList, asText } from "@/lib/format";
import { getPublicEntries } from "@/lib/public-content";

export const metadata = {
  title: "Cafés",
  description: "Los orígenes que servimos: proceso, altitud y notas de cata.",
};

export default async function CafesPage() {
  const cafes = await getPublicEntries("cafe", 100);

  return (
    <div className="space-y-10">
      <header className="max-w-2xl space-y-3">
        <h1 className="font-display text-4xl">Cafés</h1>
        <p className="text-muted">
          Todo lo que ha pasado por el molino esta temporada, con su ficha
          completa.
        </p>
      </header>

      <ul className="grid gap-8 sm:grid-cols-2">
        {cafes.map((cafe) => (
          <li key={cafe.id} className="flex gap-4 border-t border-line pt-4">
            <MediaImage
              id={cafe.data.foto}
              alt={cafe.title}
              className="aspect-square w-24 shrink-0"
              sizes="96px"
            />

            <div className="min-w-0 space-y-1">
              <h2 className="font-display text-xl">
                <Link href={`/cafes/${cafe.slug}`} className="hover:text-accent">
                  {cafe.title}
                </Link>
              </h2>
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted">
                {[asText(cafe.data.pais), asText(cafe.data.proceso)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="text-sm text-muted">
                {asList(cafe.data.notas).join(" · ")}
              </p>
              {cafe.data.puntuacion ? (
                <p className="font-mono text-xs tabular-nums">
                  {asText(cafe.data.puntuacion)} SCA
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
