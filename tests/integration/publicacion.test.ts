import { beforeEach, describe, expect, it } from "vitest";

import { crearTipo, crearUsuario, limpiarBase } from "../helpers";
import { createEntry, updateEntry } from "@/lib/entries";
import { getPublicEntries, getPublicEntry } from "@/lib/public-content";

const enUnaSemana = () => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 7);
  return fecha.toISOString();
};

beforeEach(limpiarBase);

describe("qué llega a la API pública", () => {
  it("lo publicado sí, el borrador no", async () => {
    const autor = await crearUsuario("admin");
    const tipo = await crearTipo("articulo");

    await createEntry(tipo, { title: "Visible", status: "published" }, {}, autor);
    await createEntry(tipo, { title: "Oculta", status: "draft" }, {}, autor);

    const publicas = await getPublicEntries("articulo", 50);

    expect(publicas.map((entrada) => entrada.title)).toEqual(["Visible"]);
  });

  it("una fecha futura la mantiene fuera hasta que llegue", async () => {
    const autor = await crearUsuario("admin");
    const tipo = await crearTipo("articulo");

    await createEntry(
      tipo,
      { title: "Programada", status: "published", publishedAt: enUnaSemana() },
      {},
      autor,
    );

    expect(await getPublicEntries("articulo", 50)).toHaveLength(0);
  });

  it("publicar la hace aparecer; quitar la fecha la retira", async () => {
    const autor = await crearUsuario("admin");
    const tipo = await crearTipo("articulo");
    const entrada = await createEntry(
      tipo,
      { title: "Vaivén", status: "draft" },
      {},
      autor,
    );

    expect(await getPublicEntries("articulo", 50)).toHaveLength(0);

    await updateEntry(tipo, entrada.id, { status: "published" }, {}, autor);
    expect(await getPublicEntries("articulo", 50)).toHaveLength(1);

    await updateEntry(tipo, entrada.id, { publishedAt: null }, {}, autor);
    expect(await getPublicEntries("articulo", 50)).toHaveLength(0);
  });

  it("buscar por slug respeta las mismas reglas", async () => {
    const autor = await crearUsuario("admin");
    const tipo = await crearTipo("articulo");
    await createEntry(tipo, { title: "Borrador", status: "draft" }, {}, autor);

    expect(await getPublicEntry("articulo", "borrador")).toBeNull();
  });

  it("un tipo que no existe devuelve vacío en vez de romper", async () => {
    expect(await getPublicEntries("inventado", 50)).toEqual([]);
    expect(await getPublicEntry("inventado", "lo-que-sea")).toBeNull();
  });
});

describe("relaciones en la API pública", () => {
  it("se expanden solas, pero solo si el destino está publicado", async () => {
    const autor = await crearUsuario("admin");
    const cafe = await crearTipo("cafe");
    const producto = await crearTipo("producto", [
      { apiKey: "cafe", type: "relation", targetTypeId: cafe.id },
    ]);

    const borrador = await createEntry(
      cafe,
      { title: "Sin publicar", status: "draft" },
      {},
      autor,
    );
    await createEntry(
      producto,
      { title: "V60", status: "published" },
      { cafe: borrador.id },
      autor,
    );

    const [v60] = await getPublicEntries("producto", 50);
    expect(v60.data.cafe).toBe(borrador.id);
    expect(v60.expanded?.cafe).toBeNull();

    await updateEntry(cafe, borrador.id, { status: "published" }, {}, autor);

    const [conCafe] = await getPublicEntries("producto", 50);
    expect((conCafe.expanded?.cafe as { title: string }).title).toBe("Sin publicar");
  });
});
