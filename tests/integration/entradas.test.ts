import { beforeEach, describe, expect, it } from "vitest";

import { crearTipo, crearUsuario, limpiarBase } from "../helpers";
import { AppError } from "@/lib/errors";
import { createEntry, deleteEntry, getEntry, updateEntry } from "@/lib/entries";

async function esperarError(fn: () => Promise<unknown>): Promise<AppError> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error("se esperaba un AppError y no se lanzó ninguno");
}

beforeEach(limpiarBase);

describe("crear entradas", () => {
  it("deriva el slug del título cuando no se envía", async () => {
    const autor = await crearUsuario("admin");
    const tipo = await crearTipo("articulo");

    const entrada = await createEntry(
      tipo,
      { title: "¿Cómo preparamos el V60?", status: "draft" },
      {},
      autor,
    );

    expect(entrada.slug).toBe("como-preparamos-el-v60");
  });

  it("el slug es único por tipo, no globalmente", async () => {
    const autor = await crearUsuario("admin");
    const articulo = await crearTipo("articulo");
    const producto = await crearTipo("producto");

    await createEntry(articulo, { title: "Espresso", status: "draft" }, {}, autor);

    // Mismo slug en otro tipo: permitido.
    await expect(
      createEntry(producto, { title: "Espresso", status: "draft" }, {}, autor),
    ).resolves.toBeDefined();

    // Mismo slug en el mismo tipo: conflicto.
    const error = await esperarError(() =>
      createEntry(articulo, { title: "Espresso", status: "draft" }, {}, autor),
    );
    expect(error.code).toBe("conflict");
  });

  it("el autor sale de la sesión, no del cuerpo de la petición", async () => {
    const autor = await crearUsuario("editor");
    const tipo = await crearTipo("articulo");

    const entrada = await createEntry(
      tipo,
      { title: "Mía", status: "draft" },
      {},
      autor,
    );

    expect(entrada.authorId).toBe(autor.id);
  });

  it("publicar al crear fija la fecha de publicación", async () => {
    const autor = await crearUsuario("admin");
    const tipo = await crearTipo("articulo");

    const borrador = await createEntry(tipo, { title: "A", status: "draft" }, {}, autor);
    const publicada = await createEntry(
      tipo,
      { title: "B", status: "published" },
      {},
      autor,
    );

    expect(borrador.publishedAt).toBeNull();
    expect(publicada.publishedAt).toBeInstanceOf(Date);
  });
});

describe("actualizar entradas", () => {
  it("una actualización parcial no despublica la entrada", async () => {
    const autor = await crearUsuario("admin");
    const tipo = await crearTipo("articulo");
    const entrada = await createEntry(
      tipo,
      { title: "Publicada", status: "published" },
      {},
      autor,
    );

    const actualizada = await updateEntry(
      tipo,
      entrada.id,
      { title: "Publicada y editada" },
      {},
      autor,
    );

    expect(actualizada.status).toBe("published");
    expect(actualizada.publishedAt).not.toBeNull();
  });

  it("una fecha de publicación nula despublica de cara al público", async () => {
    const autor = await crearUsuario("admin");
    const tipo = await crearTipo("articulo");
    const entrada = await createEntry(
      tipo,
      { title: "Publicada", status: "published" },
      {},
      autor,
    );

    const sinFecha = await updateEntry(
      tipo,
      entrada.id,
      { publishedAt: null },
      {},
      autor,
    );

    expect(sinFecha.publishedAt).toBeNull();
  });

  it("un editor no puede tocar una entrada de otro", async () => {
    const dueño = await crearUsuario("editor");
    const otro = await crearUsuario("editor");
    const tipo = await crearTipo("articulo");
    const entrada = await createEntry(tipo, { title: "Suya", status: "draft" }, {}, dueño);

    const error = await esperarError(() =>
      updateEntry(tipo, entrada.id, { title: "Robada" }, {}, otro),
    );

    expect(error.code).toBe("forbidden");
  });

  it("un administrador sí puede", async () => {
    const editor = await crearUsuario("editor");
    const admin = await crearUsuario("admin");
    const tipo = await crearTipo("articulo");
    const entrada = await createEntry(tipo, { title: "Suya", status: "draft" }, {}, editor);

    await expect(
      updateEntry(tipo, entrada.id, { title: "Corregida" }, {}, admin),
    ).resolves.toMatchObject({ title: "Corregida" });
  });
});

describe("borrar entradas", () => {
  it("una entrada referenciada por otra no se puede borrar", async () => {
    const autor = await crearUsuario("admin");
    const cafe = await crearTipo("cafe");
    const producto = await crearTipo("producto", [
      { apiKey: "cafe", type: "relation", targetTypeId: cafe.id },
    ]);

    const chelbesa = await createEntry(
      cafe,
      { title: "Chelbesa", status: "published" },
      {},
      autor,
    );
    await createEntry(
      producto,
      { title: "V60", status: "published" },
      { cafe: chelbesa.id },
      autor,
    );

    const error = await esperarError(() => deleteEntry(cafe, chelbesa.id, autor));

    expect(error.code).toBe("conflict");
    expect(error.message).toContain("V60");
    await expect(getEntry(cafe, chelbesa.id)).resolves.toBeDefined();
  });

  it("sin referencias, se borra", async () => {
    const autor = await crearUsuario("admin");
    const tipo = await crearTipo("articulo");
    const entrada = await createEntry(tipo, { title: "Suelta", status: "draft" }, {}, autor);

    await deleteEntry(tipo, entrada.id, autor);

    expect((await esperarError(() => getEntry(tipo, entrada.id))).code).toBe("not_found");
  });
});
