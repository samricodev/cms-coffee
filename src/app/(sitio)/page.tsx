import Link from "next/link";

import { CoffeeLabel } from "@/components/site/coffee-label";
import { JsonLd } from "@/components/site/json-ld";
import { Stamp } from "@/components/site/stamp";
import { Ticket } from "@/components/site/ticket";
import { arrowLink, buttonPrimary, buttonSecondary, eyebrow } from "@/components/site/ui";
import { asText, formatMoney } from "@/lib/format";
import { getEvents, getPublicEntries } from "@/lib/public-content";
import { site } from "@/lib/site";

type Cafe = { slug: string; title: string; data: Record<string, unknown> };

export default async function Home() {
  const [articulos, cafes, carta, { proximos }] = await Promise.all([
    getPublicEntries("articulo", 12),
    getPublicEntries("cafe", 12),
    getPublicEntries("producto", 30),
    getEvents(),
  ]);

  const destacado =
    articulos.find((item) => item.data.destacado === true) ?? articulos[0];

  const cafeDelMes = (destacado?.expanded?.cafe as Cafe | null | undefined) ?? null;

  const enMolino = cafes.filter((cafe) => cafe.slug !== cafeDelMes?.slug).slice(0, 3);
  const barra = carta.filter((item) => item.data.categoria !== "merch").slice(0, 6);
  const otros = articulos.filter((item) => item.id !== destacado?.id).slice(0, 3);

  return (
    <div className="space-y-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CafeOrCoffeeShop",
          name: site.name,
          description: site.tagline,
          url: site.url,
          servesCuisine: "Café de especialidad",
        }}
      />

      <section className="grid items-center gap-10 sm:grid-cols-[1fr_auto]">
        <div className="max-w-2xl space-y-6">
          <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl">
            {site.tagline}
          </h1>
          <p className="max-w-lg text-lg text-muted">
            Rotamos orígenes cada mes y contamos de dónde viene cada taza.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/carta" className={buttonPrimary}>
              Ver la carta
            </Link>
            <Link href="/cafes" className={buttonSecondary}>
              Lo que hay en molino
            </Link>
          </div>
        </div>

        <Stamp
          text="Café de especialidad · Tostado de temporada · "
          className="size-56 -rotate-12 text-accent max-sm:hidden"
        />
      </section>

      {destacado ? (
        <section className="grid gap-10 sm:grid-cols-[1.3fr_1fr] sm:items-start sm:gap-14">
          <div className="space-y-4 border-t-2 border-accent pt-6">
            <p className={`${eyebrow} text-accent`}>
              {asText(destacado.data.seccion) || "Del diario"}
            </p>
            <h2 className="font-display text-4xl leading-tight">
              <Link href={`/articulos/${destacado.slug}`} className="hover:text-accent">
                {destacado.title}
              </Link>
            </h2>
            <p className="max-w-prose text-lg text-muted">
              {asText(destacado.data.excerpt)}
            </p>
            <Link href={`/articulos/${destacado.slug}`} className={arrowLink}>
              Leer el artículo <span aria-hidden>→</span>
            </Link>
          </div>

          {cafeDelMes ? (
            <div className="space-y-3">
              <p className={`${eyebrow} text-muted`}>Café del mes</p>
              <CoffeeLabel cafe={cafeDelMes} />
            </div>
          ) : null}
        </section>
      ) : null}

      {enMolino.length > 0 ? (
        <section className="space-y-8">
          <Heading title="Lo que hay en molino" href="/cafes" cta="Todos los cafés" />
          <ul className="grid gap-6 sm:grid-cols-3">
            {enMolino.map((cafe) => (
              <li key={cafe.id}>
                <CoffeeLabel cafe={cafe} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {barra.length > 0 ? (
        <section className="grid gap-8 rounded-sm bg-surface p-6 sm:grid-cols-[1fr_1.4fr] sm:gap-14 sm:p-10">
          <div className="space-y-4">
            <h2 className="font-display text-3xl">En la barra</h2>
            <p className="text-muted">Cambia con los orígenes que tenemos abiertos.</p>
            <Link href="/carta" className={arrowLink}>
              Carta completa <span aria-hidden>→</span>
            </Link>
          </div>

          <ul className="divide-y divide-line self-center">
            {barra.map((item) => (
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

      {otros.length > 0 ? (
        <section className="space-y-8">
          <Heading title="Del diario" href="/articulos" cta="Todo el diario" />
          <ul className="grid gap-8 sm:grid-cols-3">
            {otros.map((articulo) => (
              <li key={articulo.id} className="space-y-3">
                <p className={`${eyebrow} text-accent`}>{asText(articulo.data.seccion)}</p>
                <h3 className="font-display text-2xl leading-tight">
                  <Link href={`/articulos/${articulo.slug}`} className="hover:text-accent">
                    {articulo.title}
                  </Link>
                </h3>
                <p className="text-muted">{asText(articulo.data.excerpt)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {proximos.length > 0 ? (
        <section className="space-y-8">
          <Heading title="Próximas catas" href="/eventos" cta="Ver agenda" />
          <ul className="grid gap-4 sm:grid-cols-2">
            {proximos.slice(0, 2).map((evento) => (
              <li key={evento.id}>
                <Ticket date={evento.data.fecha}>
                  {asText(evento.data.modalidad) ? (
                    <p className={`${eyebrow} text-muted`}>{asText(evento.data.modalidad)}</p>
                  ) : null}
                  <h3 className="mt-1 font-display text-xl leading-tight">{evento.title}</h3>
                  <p className="mt-2 font-mono text-sm text-muted">
                    {[
                      formatMoney(evento.data.precio),
                      evento.data.aforo ? `${asText(evento.data.aforo)} plazas` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Ticket>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Heading({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-line pb-4">
      <h2 className="font-display text-3xl">{title}</h2>
      <Link href={href} className={`ml-auto ${arrowLink}`}>
        {cta} <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
