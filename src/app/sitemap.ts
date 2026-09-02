import type { MetadataRoute } from "next";

import { getPublicEntries } from "@/lib/public-content";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cafes, articulos, paginas] = await Promise.all([
    getPublicEntries("cafe", 500),
    getPublicEntries("articulo", 500),
    getPublicEntries("pagina", 100),
  ]);

  const fijas = ["", "/carta", "/cafes", "/articulos", "/eventos"].map(
    (ruta) => ({
      url: `${site.url}${ruta}`,
      changeFrequency: "weekly" as const,
      priority: ruta === "" ? 1 : 0.7,
    }),
  );

  const dinamicas = [
    ...cafes.map((cafe) => ({ ruta: `/cafes/${cafe.slug}`, entry: cafe })),
    ...articulos.map((articulo) => ({
      ruta: `/articulos/${articulo.slug}`,
      entry: articulo,
    })),
    ...paginas.map((pagina) => ({ ruta: `/${pagina.slug}`, entry: pagina })),
  ].map(({ ruta, entry }) => ({
    url: `${site.url}${ruta}`,
    lastModified: entry.publishedAt ?? undefined,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...fijas, ...dinamicas];
}
