import Link from "next/link";

import { MediaImage } from "@/components/site/media-image";
import { Score } from "@/components/site/stamp";
import { eyebrow } from "@/components/site/ui";
import { asList, asText } from "@/lib/format";

type Cafe = { slug: string; title: string; data: Record<string, unknown> };

export function CoffeeLabel({
  cafe,
  heading: Heading = "h3",
}: {
  cafe: Cafe;
  heading?: "h2" | "h3";
}) {
  const score = asText(cafe.data.puntuacion);
  const notas = asList(cafe.data.notas);
  const detalle = [
    asText(cafe.data.proceso),
    cafe.data.altitud ? `${asText(cafe.data.altitud)} msnm` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-sm bg-surface outline-1 outline-dashed -outline-offset-8 outline-accent/30 transition-transform motion-safe:hover:-translate-y-0.5">
      <MediaImage
        id={cafe.data.foto}
        alt={cafe.title}
        className="aspect-4/3 w-full"
        sizes="(max-width: 640px) 100vw, 33vw"
      />

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className={`${eyebrow} text-accent`}>{asText(cafe.data.pais) || "Origen"}</p>
            {asText(cafe.data.origen) ? (
              <p className="text-xs text-muted">{asText(cafe.data.origen)}</p>
            ) : null}
          </div>
          {score ? <Score value={score} /> : null}
        </div>

        <Heading className="font-display text-2xl leading-tight">
          <Link
            href={`/cafes/${cafe.slug}`}
            className="after:absolute after:inset-0 hover:text-accent"
          >
            {cafe.title}
          </Link>
        </Heading>

        {detalle ? <p className="text-sm text-muted">{detalle}</p> : null}

        {notas.length > 0 ? (
          <ul className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-2 text-sm">
            {notas.map((nota) => (
              <li key={nota} className="flex items-center gap-1.5">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                {nota}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
