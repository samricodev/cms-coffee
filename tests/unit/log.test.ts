import { afterEach, describe, expect, it, vi } from "vitest";

import { logError } from "@/lib/log";

const capturar = () => vi.spyOn(console, "error").mockImplementation(() => {});

afterEach(() => vi.restoreAllMocks());

describe("registro de errores", () => {
  it("devuelve un identificador corto y lo incluye en la línea", () => {
    const spy = capturar();

    const id = logError(new Error("algo falló"), { origen: "prueba" });

    expect(id).toHaveLength(8);

    const linea = JSON.parse(spy.mock.calls[0][0] as string);
    expect(linea.id).toBe(id);
    expect(linea.nivel).toBe("error");
    expect(linea.origen).toBe("prueba");
    expect(linea.error.mensaje).toBe("algo falló");
  });

  it("emite una sola línea de JSON válido", () => {
    const spy = capturar();

    logError(new Error("x"));

    const salida = spy.mock.calls[0][0] as string;
    expect(salida.split("\n").filter(Boolean).length).toBeGreaterThan(0);
    expect(() => JSON.parse(salida)).not.toThrow();
  });

  it("conserva la causa, que es donde viaja el error real de Postgres", () => {
    const spy = capturar();

    const interno = Object.assign(new Error("duplicate key"), { code: "23505" });
    logError(new Error("Failed query", { cause: interno }));

    const linea = JSON.parse(spy.mock.calls[0][0] as string);
    expect(linea.error.causa.mensaje).toBe("duplicate key");
    expect(linea.error.causa.codigo).toBe("23505");
  });

  it("no revienta con algo que no es un Error", () => {
    capturar();
    expect(() => logError("una cadena suelta")).not.toThrow();
  });
});
