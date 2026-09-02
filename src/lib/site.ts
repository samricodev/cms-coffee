export const site = {
  name: "Cafetería",
  tagline: "Café de especialidad, tostado de temporada y una carta corta.",
  url: process.env.SITE_URL ?? "http://localhost:3000",
};

export const nav = [
  { href: "/carta", label: "Carta" },
  { href: "/cafes", label: "Cafés" },
  { href: "/articulos", label: "Diario" },
  { href: "/eventos", label: "Eventos" },
  { href: "/quienes-somos", label: "Nosotros" },
  { href: "/buscar", label: "Buscar" },
] as const;
