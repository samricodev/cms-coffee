import { describe, expect, it } from "vitest";

import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("quita tildes sin borrar la letra", () => {
    expect(slugify("Café de especialidad")).toBe("cafe-de-especialidad");
    expect(slugify("Añejo")).toBe("anejo");
  });

  it("descarta signos y colapsa separadores", () => {
    expect(slugify("¿Cómo funciona un CMS?  Guía 2026")).toBe(
      "como-funciona-un-cms-guia-2026",
    );
  });

  it("no deja guiones sueltos en los extremos", () => {
    expect(slugify("  --hola--  ")).toBe("hola");
  });

  it("devuelve cadena vacía si no queda nada utilizable", () => {
    expect(slugify("¿¡...!?")).toBe("");
  });

  it("recorta a 80 caracteres", () => {
    expect(slugify("a".repeat(200))).toHaveLength(80);
  });
});
