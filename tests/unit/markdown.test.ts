import { describe, expect, it } from "vitest";

import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  it("convierte Markdown a HTML", () => {
    const html = renderMarkdown("## Título\n\nTexto **fuerte**.");
    expect(html).toContain("<h2>");
    expect(html).toContain("<strong>fuerte</strong>");
  });

  it("escapa el HTML crudo en lugar de ejecutarlo", () => {
    const html = renderMarkdown("<script>alert('xss')</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapa también atributos peligrosos dentro de etiquetas", () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">');
    expect(html).not.toContain("onerror=\"alert(1)\"");
  });

  it("no rompe con entrada vacía", () => {
    expect(renderMarkdown("")).toBe("");
  });
});
