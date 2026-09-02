import Link from "next/link";
import { notFound } from "next/navigation";

import { MediaImage } from "@/components/site/media-image";
import { Prose } from "@/components/site/prose";
import { asList, asText, formatDate } from "@/lib/format";
import { getPublicEntries, getPublicEntry } from "@/lib/public-content";

export async function generateStaticParams() {
  const articulos = await getPublicEntries("articulo", 100);
  return articulos.map((articulo) => ({ slug: articulo.slug }));
}

export async function generateMetadata({ params }: PageProps<"/articulos/[slug]">) {
  const { slug } = await params;
  const articulo = await getPublicEntry("articulo", slug);
  if (!articulo) return {};

  const description =
    articulo.seoDescription ?? asText(articulo.data.excerpt) ?? undefined;

  return {
    title: articulo.title,
    description,
    openGraph: {
      title: articulo.title,
      description,
      type: "article",
      publishedTime: articulo.publishedAt?.toISOString(),
      images: articulo.seoImageId
        ? [`/api/media/${articulo.seoImageId}`]
        : typeof articulo.data.portada === "string"
          ? [`/api/media/${articulo.data.portada}`]
          : undefined,
    },
  };
}

export default async function ArticuloPage({
  params,
}: PageProps<"/articulos/[slug]">) {
  const { slug } = await params;
  const articulo = await getPublicEntry("articulo", slug);

  if (!articulo) notFound();

  const cafe = articulo.expanded?.cafe as
    | { slug: string; title: string; data: Record<string, unknown> }
    | null
    | undefined;

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-3">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-accent">
          {[asText(articulo.data.seccion), formatDate(articulo.publishedAt)]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <h1 className="font-display text-4xl leading-[1.15]">{articulo.title}</h1>
        {asText(articulo.data.excerpt) ? (
          <p className="text-lg text-muted">{asText(articulo.data.excerpt)}</p>
        ) : null}
      </header>

      {typeof articulo.data.portada === "string" ? (
        <MediaImage
          id={articulo.data.portada}
          alt={articulo.title}
          className="aspect-16/9 w-full"
          sizes="(max-width: 768px) 100vw, 42rem"
          priority
        />
      ) : null}

      <Prose markdown={articulo.data.body} />

      {cafe ? (
        <aside className="space-y-2 border-t border-line pt-6">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">
            El café del que habla
          </p>
          <h2 className="font-display text-2xl">
            <Link href={`/cafes/${cafe.slug}`} className="hover:text-accent">
              {cafe.title}
            </Link>
          </h2>
          <p className="text-sm text-muted">
            {[asText(cafe.data.pais), asText(cafe.data.proceso)]
              .filter(Boolean)
              .join(" · ")}
            {asList(cafe.data.notas).length > 0
              ? ` — ${asList(cafe.data.notas).join(", ")}`
              : ""}
          </p>
        </aside>
      ) : null}

      <p>
        <Link
          href="/articulos"
          className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted hover:text-accent"
        >
          ← Todo el diario
        </Link>
      </p>
    </article>
  );
}
