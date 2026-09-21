import { beforeEach, describe, expect, it } from "vitest";

import { crearUsuario, limpiarBase } from "../helpers";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { createSession } from "@/lib/auth/session";

describe("sesiones caducadas", () => {
  beforeEach(limpiarBase);

  it("se borran al crear cualquier sesión, sin tocar las vigentes", async () => {
    const ana = await crearUsuario("editor");
    const luis = await crearUsuario("editor");

    await db.insert(sessions).values({
      tokenHash: "caducada",
      userId: ana.id,
      expiresAt: new Date(Date.now() - 60_000),
    });
    await db.insert(sessions).values({
      tokenHash: "vigente",
      userId: ana.id,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await createSession(luis.id);

    const restantes = await db.select().from(sessions);

    expect(restantes).toHaveLength(2);
    expect(restantes.map((sesion) => sesion.tokenHash)).toContain("vigente");
    expect(restantes.map((sesion) => sesion.tokenHash)).not.toContain("caducada");
    expect(restantes.every((sesion) => sesion.expiresAt > new Date())).toBe(true);
  });
});
