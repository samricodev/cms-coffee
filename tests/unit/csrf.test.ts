import { describe, expect, it } from "vitest";

import { esEscrituraDeOtroOrigen } from "@/lib/csrf";

const peticion = (cambios: Partial<Parameters<typeof esEscrituraDeOtroOrigen>[0]>) =>
  esEscrituraDeOtroOrigen({
    method: "POST",
    origin: "https://cafeteria.test",
    host: "cafeteria.test",
    forwardedHost: null,
    ...cambios,
  });

describe("esEscrituraDeOtroOrigen", () => {
  it("deja pasar las escrituras desde el propio sitio", () => {
    expect(peticion({})).toBe(false);
  });

  it("bloquea las escrituras que vienen de otra web", () => {
    expect(peticion({ origin: "https://malvada.test" })).toBe(true);
    expect(peticion({ method: "DELETE", origin: "https://malvada.test" })).toBe(true);
  });

  it("trata un subdominio como otro origen", () => {
    expect(peticion({ origin: "https://blog.cafeteria.test" })).toBe(true);
  });

  it("bloquea Origin: null", () => {
    expect(peticion({ origin: "null" })).toBe(true);
  });

  it("no bloquea lecturas aunque vengan de fuera", () => {
    expect(peticion({ method: "GET", origin: "https://malvada.test" })).toBe(false);
  });

  it("deja pasar a clientes sin navegador, que no envían Origin", () => {
    expect(peticion({ origin: null })).toBe(false);
  });

  it("detrás de un proxy compara con el host reenviado", () => {
    expect(peticion({ host: "localhost:3000", forwardedHost: "cafeteria.test" })).toBe(false);
    expect(peticion({ host: "cafeteria.test", forwardedHost: "otro.test" })).toBe(true);
  });

  it("tiene en cuenta el puerto", () => {
    expect(peticion({ origin: "http://localhost:3010", host: "localhost:3010" })).toBe(false);
    expect(peticion({ origin: "http://localhost:4000", host: "localhost:3010" })).toBe(true);
  });
});
