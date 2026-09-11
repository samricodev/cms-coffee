import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/site/json-ld";
import { MediaImage } from "@/components/site/media-image";
import { Score } from "@/components/site/stamp";
import { arrowLink, eyebrow } from "@/components/site/ui";
import { asList, asText, formatMoney } from "@/lib/format";
import { getPublicEntry, getPublicReferences } from "@/lib/public-content";
import { site } from "@/lib/site";

const FICHA: Array<[string, string]> = [
  ["Tostador", "tostador"],
  ["País", "pais"],
  ["Región", "origen"],
  ["Productor", "productor"],
  ["Variedad", "variedad"],
  ["Proceso", "proceso"],
  ["Altitud", "altitud"],
  ["Tueste", "tueste"],
];

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/cafes/[slug]">) {
  const { slug } = await params;
  const cafe = await getPublicEntry("cafe", slug);
  if (!cafe) return {};

  return {
    title: cafe.title,
    description: cafe.seoDescription ?? undefined,
    openGraph: {
      title: cafe.title,
      description: cafe.seoDescription ?? undefined,
      images: cafe.seoImageId ? [`/api/media/${cafe.seoImageId}`] : undefined,
    },
  };
}

export default async function CafePage({ params }: PageProps<"/cafes/[slug]">) {
  const { slug } = await params;
  const cafe = await getPublicEntry("cafe", slug);

  if (!cafe) notFound();

  const foto = typeof cafe.data.foto === "string" ? cafe.data.foto : null;
  const referencias = await getPublicReferences(cafe.id);
  const enCarta = referencias.filter((item) => item.typeApiId === "producto");
  const enDiario = referencias.filter((item) => item.typeApiId === "articulo");

  return (
    <article className="space-y-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: cafe.title,
          description: cafe.seoDescription ?? undefined,
          url: `${site.url}/cafes/${cafe.slug}`,
          category: "Café de especialidad",
          additionalProperty: FICHA.map(([label, key]) => ({
            "@type": "PropertyValue",
            name: label,
            value: asText(cafe.data[key]),
          })).filter((property) => property.value !== ""),
        }}
      />

      <header className="grid gap-10 sm:grid-cols-[1.2fr_1fr] sm:items-start sm:gap-14">
        <div className="space-y-6">
          <p className={`${eyebrow} text-accent`}>
            {[asText(cafe.data.pais), asText(cafe.data.origen)].filter(Boolean).join(" · ")}
          </p>

          <div className="flex items-start gap-6">
            <h1 className="flex-1 font-display text-5xl leading-[1.05]">{cafe.title}</h1>
            {cafe.data.puntuacion ? (
              <Score value={asText(cafe.data.puntuacion)} large />
            ) : null}
          </div>

          {cafe.seoDescription ? (
            <p className="max-w-prose text-lg text-muted">{cafe.seoDescription}</p>
          ) : null}

          {asList(cafe.data.notas).length > 0 ? (
            <div className="space-y-3">
              <p className={`${eyebrow} text-muted`}>En taza</p>
              <ul className="flex flex-wrap gap-2">
                {asList(cafe.data.notas).map((nota) => (
                  <li
                    key={nota}
                    className="flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-sm"
                  >
                    <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                    {nota}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          {foto ? (
            <MediaImage
              id={foto}
              alt={cafe.title}
              className="aspect-square w-full rounded-sm"
              sizes="(max-width: 640px) 100vw, 40vw"
              priority
            />
          ) : null}

          <section className="rounded-sm bg-surface p-7 outline-1 outline-dashed -outline-offset-8 outline-accent/30">
            <h2 className={`mb-3 ${eyebrow} text-accent`}>Ficha</h2>
            <dl>
              {FICHA.map(([label, key]) => {
                const value = asText(cafe.data[key]);
                if (!value) return null;

                return (
                  <div
                    key={key}
                    className="flex justify-between gap-6 border-b border-line py-2 text-sm last:border-b-0"
                  >
                    <dt className="text-muted">{label}</dt>
                    <dd className="text-right font-medium">
                      {key === "altitud" ? `${value} msnm` : value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        </div>
      </header>

      {enCarta.length > 0 || enDiario.length > 0 ? (
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-14">
          {enCarta.length > 0 ? (
            <section className="space-y-4">
              <h2 className="border-b border-line pb-3 font-display text-2xl">En la barra</h2>
              <ul className="divide-y divide-line">
                {enCarta.map((item) => (
                  <li key={item.id} className="flex items-baseline gap-3 py-3">
                    <span className="font-display text-lg">{item.title}</span>
                    <span className="flex-1 border-b border-dotted border-muted/40" />
                    <span className="font-mono text-accent tabular-nums">
                      {formatMoney(item.data.precio)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {enDiario.length > 0 ? (
            <section className="space-y-4">
              <h2 className="border-b border-line pb-3 font-display text-2xl">En el diario</h2>
              <ul className="space-y-3">
                {enDiario.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/articulos/${item.slug}`}
                      className="font-display text-xl leading-tight hover:text-accent"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      <p>
        <Link href="/cafes" className={arrowLink}>
          <span aria-hidden>←</span> Todos los cafés
        </Link>
      </p>
    </article>
  );
}
