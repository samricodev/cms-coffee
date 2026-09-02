import { getPublicEntries } from "@/lib/public-content";
import { site } from "@/lib/site";

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const articulos = await getPublicEntries("articulo", 50);

  const items = articulos
    .map((articulo) => {
      const url = `${site.url}/articulos/${articulo.slug}`;
      const descripcion =
        articulo.seoDescription ??
        (typeof articulo.data.excerpt === "string" ? articulo.data.excerpt : "");

      return [
        "    <item>",
        `      <title>${escape(articulo.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escape(descripcion)}</description>`,
        articulo.publishedAt
          ? `      <pubDate>${articulo.publishedAt.toUTCString()}</pubDate>`
          : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escape(site.name)}</title>`,
    `    <link>${site.url}</link>`,
    `    <description>${escape(site.tagline)}</description>`,
    "    <language>es</language>",
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
