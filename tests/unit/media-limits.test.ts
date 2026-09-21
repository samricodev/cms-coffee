import { describe, expect, it } from "vitest";

import {
  MAX_MEDIA_BYTES,
  formatSize,
  mediaExtension,
  mediaProblem,
  mediaResponseHeaders,
} from "@/lib/media-limits";

describe("mediaProblem", () => {
  it("acepta una foto dentro del límite", () => {
    expect(mediaProblem({ type: "image/jpeg", size: 300 * 1024 })).toBeNull();
  });

  it("rechaza tipos que no están en la lista", () => {
    expect(mediaProblem({ type: "text/html", size: 10 })).toBe("Tipo no permitido: text/html.");
    expect(mediaProblem({ type: "", size: 10 })).toBe("Tipo no permitido: desconocido.");
  });

  it("rechaza SVG, que puede llevar scripts", () => {
    expect(mediaProblem({ type: "image/svg+xml", size: 10 })).not.toBeNull();
  });

  it("no confunde propiedades heredadas con tipos permitidos", () => {
    expect(mediaExtension("constructor")).toBeUndefined();
    expect(mediaProblem({ type: "toString", size: 10 })).not.toBeNull();
  });

  it("rechaza archivos por encima de 5 MB diciendo cuánto pesan", () => {
    expect(mediaProblem({ type: "image/png", size: MAX_MEDIA_BYTES })).toBeNull();
    expect(mediaProblem({ type: "image/png", size: 7.3 * 1024 * 1024 })).toBe(
      "Pesa 7.3 MB y el máximo son 5 MB. Redúcelo antes de subirlo.",
    );
  });
});

describe("formatSize", () => {
  it("usa KB por debajo de 1 MB y MB con un decimal por encima", () => {
    expect(formatSize(512 * 1024)).toBe("512 KB");
    expect(formatSize(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });
});

describe("mediaResponseHeaders", () => {
  it("muestra en el navegador los tipos admitidos", () => {
    const cabeceras = mediaResponseHeaders({ mimeType: "image/jpeg", size: 1024, filename: "taza.jpg" });

    expect(cabeceras["Content-Type"]).toBe("image/jpeg");
    expect(cabeceras["Content-Disposition"]).toMatch(/^inline;/);
    expect(cabeceras["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("obliga a descargar un SVG guardado antes de que dejara de admitirse", () => {
    const cabeceras = mediaResponseHeaders({ mimeType: "image/svg+xml", size: 10, filename: "logo.svg" });

    expect(cabeceras["Content-Type"]).toBe("application/octet-stream");
    expect(cabeceras["Content-Disposition"]).toMatch(/^attachment;/);
  });
});
