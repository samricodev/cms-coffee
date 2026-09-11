import Link from "next/link";
import { notFound } from "next/navigation";

import { CoffeeLabel } from "@/components/site/coffee-label";
import { JsonLd } from "@/components/site/json-ld";
import { MediaImage } from "@/components/site/media-image";
import { Prose } from "@/components/site/prose";
import { arrowLink, eyebrow } from "@/components/site/ui";
import { asText, formatDate } from "@/lib/format";
import { getPublicEntry } from "@/lib/public-content";
import { site } from "@/lib/site";

export const instant = false;

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
    <article className="mx-auto max-w-2xl space-y-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: articulo.title,
          description:
            articulo.seoDescription ?? asText(articulo.data.excerpt) ?? undefined,
          datePublished: articulo.publishedAt?.toISOString(),
          url: `${site.url}/articulos/${articulo.slug}`,
          publisher: { "@type": "Organization", name: site.name },
        }}
      />

      <header className="space-y-5 border-b border-line pb-8">
        <p className={`${eyebrow} text-accent`}>
          {[asText(articulo.data.seccion), formatDate(articulo.publishedAt)]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <h1 className="font-display text-5xl leading-[1.08]">{articulo.title}</h1>
        {asText(articulo.data.excerpt) ? (
          <p className="text-xl text-muted">{asText(articulo.data.excerpt)}</p>
        ) : null}
      </header>

      {typeof articulo.data.portada === "string" ? (
        <MediaImage
          id={articulo.data.portada}
          alt={articulo.title}
          className="aspect-video w-full rounded-sm"
          sizes="(max-width: 768px) 100vw, 42rem"
          priority
        />
      ) : null}

      <Prose markdown={articulo.data.body} className="text-lg" />

      {cafe ? (
        <aside className="space-y-3 border-t border-line pt-8">
          <p className={`${eyebrow} text-muted`}>El café del que habla</p>
          <div className="max-w-sm">
            <CoffeeLabel cafe={cafe} heading="h2" />
          </div>
        </aside>
      ) : null}

      <p>
        <Link href="/articulos" className={arrowLink}>
          <span aria-hidden>←</span> Todo el diario
        </Link>
      </p>
    </article>
  );
}
