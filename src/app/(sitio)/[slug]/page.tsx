import { notFound } from "next/navigation";

import { Prose } from "@/components/site/prose";
import { getPublicEntry } from "@/lib/public-content";

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const pagina = await getPublicEntry("pagina", slug);
  if (!pagina) return {};

  return {
    title: pagina.title,
    description: pagina.seoDescription ?? undefined,
  };
}

export default async function PaginaPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const pagina = await getPublicEntry("pagina", slug);

  if (!pagina) notFound();

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <h1 className="border-b border-line pb-6 font-display text-5xl leading-[1.08]">
        {pagina.title}
      </h1>
      <Prose markdown={pagina.data.cuerpo} className="text-lg" />
    </article>
  );
}
