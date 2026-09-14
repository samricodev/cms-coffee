import { beforeEach, describe, expect, it } from "vitest";

import { crearUsuario, limpiarBase } from "../helpers";
import { db } from "@/db";
import { media } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { updateMediaAlt } from "@/lib/media";

async function crearArchivo(uploadedBy: string) {
  const [item] = await db
    .insert(media)
    .values({
      filename: "taza.jpg",
      mimeType: "image/jpeg",
      size: 1024,
      storageKey: "taza-de-prueba.jpg",
      uploadedBy,
    })
    .returning();

  return item;
}

describe("texto alternativo de los archivos", () => {
  beforeEach(limpiarBase);

  it("nace vacío y se puede guardar", async () => {
    const autor = await crearUsuario("admin");
    const archivo = await crearArchivo(autor.id);

    expect(archivo.alt).toBeNull();

    const descrito = await updateMediaAlt(archivo.id, "Taza de espresso sobre un plato oscuro");
    expect(descrito.alt).toBe("Taza de espresso sobre un plato oscuro");
  });

  it("se puede vaciar para volver al título de la entrada", async () => {
    const autor = await crearUsuario("admin");
    const archivo = await crearArchivo(autor.id);

    await updateMediaAlt(archivo.id, "Una descripción");
    const vaciado = await updateMediaAlt(archivo.id, null);

    expect(vaciado.alt).toBeNull();
  });

  it("no toca archivos que no existen", async () => {
    await expect(
      updateMediaAlt("3f0d6b3a-0000-4000-8000-000000000000", "Da igual"),
    ).rejects.toThrow(AppError);
  });
});
