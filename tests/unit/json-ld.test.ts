import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "@/lib/json-ld";

describe("serializeJsonLd", () => {
  it("no deja que un título cierre la etiqueta <script>", () => {
    const salida = serializeJsonLd({ headline: "</script><script>alert(1)</script>" });

    expect(salida).not.toMatch(/<\/script/i);
    expect(salida).not.toContain("<");
  });

  it("sigue siendo el mismo JSON al leerlo", () => {
    const datos = { headline: "Café & tostadas <nuevo>", autor: { name: "Ana" } };

    expect(JSON.parse(serializeJsonLd(datos))).toEqual(datos);
  });
});
