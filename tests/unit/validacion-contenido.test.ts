import { describe, expect, it } from "vitest";

import { campo } from "../helpers";
import {
  buildEntryDataSchema,
  entryBaseSchema,
  updateEntryBaseSchema,
} from "@/lib/validation/content";

const analizar = (fields: Parameters<typeof buildEntryDataSchema>[0], data: unknown) =>
  buildEntryDataSchema(fields).safeParse(data);

describe("esquema dinámico por tipo de campo", () => {
  it("acepta texto y recorta espacios", () => {
    const r = analizar([campo("titular", "text")], { titular: "  hola  " });
    expect(r.success && r.data.titular).toBe("hola");
  });

  it("convierte números que llegan como texto", () => {
    const r = analizar([campo("precio", "number")], { precio: "12.5" });
    expect(r.success && r.data.precio).toBe(12.5);
  });

  it("rechaza un número que no lo es, con la etiqueta del campo", () => {
    const r = analizar([campo("precio", "number", { label: "Precio" })], {
      precio: "caro",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain("Precio");
  });

  it("distingue campo ausente de campo con tipo incorrecto", () => {
    const obligatorio = [campo("precio", "number", { label: "Precio", required: true })];

    expect(analizar(obligatorio, {}).error?.issues[0].message).toBe(
      "Precio es obligatorio",
    );
    expect(analizar(obligatorio, { precio: "caro" }).error?.issues[0].message).toBe(
      "Precio debe ser un número",
    );
  });

  it("solo admite las opciones declaradas en un select", () => {
    const fields = [campo("proceso", "select", { choices: ["lavado", "natural"] })];

    expect(analizar(fields, { proceso: "natural" }).success).toBe(true);
    expect(analizar(fields, { proceso: "anaeróbico" }).success).toBe(false);
  });

  it("exige formato de fecha AAAA-MM-DD", () => {
    const fields = [campo("fecha", "date")];

    expect(analizar(fields, { fecha: "2026-10-15" }).success).toBe(true);
    expect(analizar(fields, { fecha: "15/10/2026" }).success).toBe(false);
  });

  it("deduplica las etiquetas y rechaza una cadena suelta", () => {
    const fields = [campo("notas", "tags")];

    const r = analizar(fields, { notas: ["jazmín", "cacao", "jazmín"] });
    expect(r.success && r.data.notas).toEqual(["jazmín", "cacao"]);

    expect(analizar(fields, { notas: "jazmín" }).success).toBe(false);
  });

  it("una etiqueta obligatoria necesita al menos un valor", () => {
    const fields = [campo("notas", "tags", { required: true, label: "Notas" })];

    expect(analizar(fields, { notas: [] }).success).toBe(false);
    expect(analizar(fields, { notas: ["cacao"] }).success).toBe(true);
  });

  it("un archivo debe ser un UUID", () => {
    const fields = [campo("foto", "media")];

    expect(analizar(fields, { foto: crypto.randomUUID() }).success).toBe(true);
    expect(analizar(fields, { foto: "/uploads/foto.png" }).success).toBe(false);
  });

  it("una relación simple guarda un id y la múltiple una lista", () => {
    const id = crypto.randomUUID();

    const simple = [campo("cafe", "relation")];
    expect(analizar(simple, { cafe: id }).success).toBe(true);
    expect(analizar(simple, { cafe: [id] }).success).toBe(false);

    const multiple = [campo("cafes", "relation", { multiple: true })];
    const r = analizar(multiple, { cafes: [id, id] });
    expect(r.success && r.data.cafes).toEqual([id]);
  });

  it("descarta claves que el tipo no declara", () => {
    const r = analizar([campo("titular", "text")], {
      titular: "hola",
      inventado: "basura",
    });
    expect(r.success && r.data).toEqual({ titular: "hola" });
  });

  it("los campos opcionales pueden faltar sin error", () => {
    expect(analizar([campo("notas", "tags"), campo("foto", "media")], {}).success).toBe(
      true,
    );
  });
});

describe("campos base de una entrada", () => {
  it("al crear, el estado por defecto es borrador", () => {
    const r = entryBaseSchema.safeParse({ title: "Hola" });
    expect(r.success && r.data.status).toBe("draft");
  });

  it("al actualizar, un estado ausente NO vuelve a borrador", () => {
    const r = updateEntryBaseSchema.safeParse({ title: "Hola" });
    expect(r.success && "status" in r.data).toBe(false);
  });

  it("una fecha de publicación vacía significa borrarla, no ignorarla", () => {
    const vacia = entryBaseSchema.safeParse({ title: "Hola", publishedAt: "" });
    expect(vacia.success && vacia.data.publishedAt).toBeNull();

    const ausente = entryBaseSchema.safeParse({ title: "Hola" });
    expect(ausente.success && ausente.data.publishedAt).toBeUndefined();
  });

  it("rechaza un slug con mayúsculas o espacios", () => {
    expect(entryBaseSchema.safeParse({ title: "x", slug: "Hola Mundo" }).success).toBe(
      false,
    );
    expect(entryBaseSchema.safeParse({ title: "x", slug: "hola-mundo" }).success).toBe(
      true,
    );
  });
});
