import Link from "next/link";

import { MediaImage } from "@/components/site/media-image";
import { asList, asText, formatMoney, formatShortDate } from "@/lib/format";
import { getEvents, getPublicEntries } from "@/lib/public-content";
import { site } from "@/lib/site";

export default async function Home() {
  const [articulos, cafes, carta, { proximos }] = await Promise.all([
    getPublicEntries("articulo", 12),
    getPublicEntries("cafe", 12),
    getPublicEntries("producto", 30),
    getEvents(),
  ]);

  const destacado =
    articulos.find((item) => item.data.destacado === true) ?? articulos[0];

  const cafeDelMes =
    (destacado?.expanded?.cafe as { slug: string; title: string; data: Record<string, unknown> } | null) ??
    null;

  const otros = articulos.filter((item) => item.id !== destacado?.id).slice(0, 3);

  return (
    <div className="space-y-16">
      <section className="max-w-2xl space-y-3">
        <h1 className="font-display text-4xl leading-[1.1] sm:text-5xl">
          {site.tagline}
        </h1>
        <p className="text-muted">
          Rotamos orígenes cada mes y contamos de dónde viene cada taza.
        </p>
      </section>

      {destacado ? (
        <section className="grid gap-6 border-t border-line pt-8 sm:grid-cols-[1.4fr_1fr] sm:gap-10">
          <div className="space-y-3">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-accent">
              {asText(destacado.data.seccion) || "Del diario"}
            </p>
            <h2 className="font-display text-3xl leading-tight">
              <Link href={`/articulos/${destacado.slug}`} className="hover:text-accent">
                {destacado.title}
              </Link>
            </h2>
            <p className="max-w-prose text-muted">
              {asText(destacado.data.excerpt)}
            </p>
            <Link
              href={`/articulos/${destacado.slug}`}
              className="inline-block font-mono text-[0.7rem] uppercase tracking-[0.14em] text-accent underline-offset-4 hover:underline"
            >
              Leer
            </Link>
          </div>

          {cafeDelMes ? (
            <aside className="space-y-3 border-l border-line pl-6 max-sm:border-l-0 max-sm:pl-0 max-sm:border-t max-sm:pt-6">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                Café del mes
              </p>
              <h3 className="font-display text-2xl">
                <Link href={`/cafes/${cafeDelMes.slug}`} className="hover:text-accent">
                  {cafeDelMes.title}
                </Link>
              </h3>
              <dl className="space-y-1 font-mono text-xs">
                <Row label="Origen" value={asText(cafeDelMes.data.pais)} />
                <Row label="Proceso" value={asText(cafeDelMes.data.proceso)} />
                <Row label="SCA" value={asText(cafeDelMes.data.puntuacion)} />
              </dl>
              <ul className="flex flex-wrap gap-1.5">
                {asList(cafeDelMes.data.notas).map((nota) => (
                  <li
                    key={nota}
                    className="border border-line px-2 py-0.5 text-xs text-muted"
                  >
                    {nota}
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </section>
      ) : null}

      {cafes.length > 0 ? (
        <section className="space-y-6 border-t border-line pt-8">
          <Heading title="Lo que hay en molino" href="/cafes" cta="Ver todos" />
          <ul className="grid gap-6 sm:grid-cols-3">
            {cafes.slice(0, 3).map((cafe) => (
              <li key={cafe.id} className="space-y-2">
                <MediaImage
                  id={cafe.data.foto}
                  alt={cafe.title}
                  className="aspect-4/3 w-full"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <h3 className="font-display text-xl">
                  <Link href={`/cafes/${cafe.slug}`} className="hover:text-accent">
                    {cafe.title}
                  </Link>
                </h3>
                <p className="font-mono text-xs text-muted">
                  {asText(cafe.data.pais)} · {asText(cafe.data.proceso)}
                </p>
                <p className="text-sm text-muted">
                  {asList(cafe.data.notas).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {carta.length > 0 ? (
        <section className="space-y-6 border-t border-line pt-8">
          <Heading title="En la barra" href="/carta" cta="Carta completa" />
          <ul className="max-w-2xl divide-y divide-line">
            {carta
              .filter((item) => item.data.categoria !== "merch")
              .slice(0, 5)
              .map((item) => (
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

      {otros.length > 0 ? (
        <section className="space-y-6 border-t border-line pt-8">
          <Heading title="Del diario" href="/articulos" cta="Leer más" />
          <ul className="grid gap-6 sm:grid-cols-3">
            {otros.map((articulo) => (
              <li key={articulo.id} className="space-y-2">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                  {asText(articulo.data.seccion)}
                </p>
                <h3 className="font-display text-xl leading-tight">
                  <Link
                    href={`/articulos/${articulo.slug}`}
                    className="hover:text-accent"
                  >
                    {articulo.title}
                  </Link>
                </h3>
                <p className="text-sm text-muted">
                  {asText(articulo.data.excerpt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {proximos.length > 0 ? (
        <section className="space-y-6 border-t border-line pt-8">
          <Heading title="Próximas catas" href="/eventos" cta="Ver agenda" />
          <ul className="space-y-4">
            {proximos.slice(0, 2).map((evento) => (
              <li key={evento.id} className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-sm text-accent tabular-nums">
                  {formatShortDate(evento.data.fecha)}
                </span>
                <span className="font-display text-xl">{evento.title}</span>
                <span className="font-mono text-xs text-muted">
                  {formatMoney(evento.data.precio)}
                  {evento.data.aforo ? ` · ${asText(evento.data.aforo)} plazas` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Heading({
  title,
  href,
  cta,
}: {
  title: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-3">
      <h2 className="font-display text-2xl">{title}</h2>
      <Link
        href={href}
        className="ml-auto font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted hover:text-accent"
      >
        {cta}
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 uppercase tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}
