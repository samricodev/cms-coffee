import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/site/json-ld";
import { MediaImage } from "@/components/site/media-image";
import { asList, asText, formatMoney } from "@/lib/format";
import {
  getPublicEntries,
  getPublicEntry,
  getPublicReferences,
} from "@/lib/public-content";
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

export async function generateStaticParams() {
  const cafes = await getPublicEntries("cafe", 100);
  return cafes.map((cafe) => ({ slug: cafe.slug }));
}

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
    <article className="space-y-10">
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

      <header
        className={
          foto
            ? "grid gap-6 sm:grid-cols-[1fr_1.2fr] sm:items-start sm:gap-10"
            : "max-w-2xl"
        }
      >
        <MediaImage
          id={foto}
          alt={cafe.title}
          className="aspect-square w-full"
          sizes="(max-width: 640px) 100vw, 40vw"
          priority
        />

        <div className="space-y-4">
          <h1 className="font-display text-4xl leading-tight">{cafe.title}</h1>

          {cafe.seoDescription ? (
            <p className="max-w-prose text-muted">{cafe.seoDescription}</p>
          ) : null}

          <ul className="flex flex-wrap gap-1.5">
            {asList(cafe.data.notas).map((nota) => (
              <li key={nota} className="border border-line px-2.5 py-1 text-sm">
                {nota}
              </li>
            ))}
          </ul>

          {cafe.data.puntuacion ? (
            <p className="font-mono text-sm tabular-nums text-accent">
              {asText(cafe.data.puntuacion)} puntos SCA
            </p>
          ) : null}
        </div>
      </header>

      <section className="border-t border-line pt-6">
        <h2 className="mb-4 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">
          Ficha
        </h2>
        <dl className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
          {FICHA.map(([label, key]) => {
            const value = asText(cafe.data[key]);
            if (!value) return null;

            return (
              <div key={key} className="flex gap-3 border-b border-line py-1.5">
                <dt className="w-28 shrink-0 font-mono text-xs uppercase tracking-[0.1em] text-muted">
                  {label}
                </dt>
                <dd className="text-sm">
                  {key === "altitud" ? `${value} msnm` : value}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      {enCarta.length > 0 ? (
        <section className="border-t border-line pt-6">
          <h2 className="mb-4 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">
            En carta
          </h2>
          <ul className="max-w-2xl divide-y divide-line">
            {enCarta.map((item) => (
              <li key={item.id} className="flex items-baseline gap-3 py-2.5">
                <span>{item.title}</span>
                <span className="flex-1 border-b border-dotted border-line" />
                <span className="font-mono text-sm tabular-nums">
                  {formatMoney(item.data.precio)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {enDiario.length > 0 ? (
        <section className="border-t border-line pt-6">
          <h2 className="mb-4 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">
            En el diario
          </h2>
          <ul className="space-y-2">
            {enDiario.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/articulos/${item.slug}`}
                  className="font-display text-xl hover:text-accent"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p>
        <Link
          href="/cafes"
          className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted hover:text-accent"
        >
          ← Todos los cafés
        </Link>
      </p>
    </article>
  );
}
