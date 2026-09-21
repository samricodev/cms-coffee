import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, securityHeaders } from "@/lib/security-headers";

const valor = (dev: boolean, key: string) =>
  securityHeaders(dev).find((cabecera) => cabecera.key === key)?.value;

describe("contentSecurityPolicy", () => {
  it("impide incrustar el sitio y cargar scripts de otros dominios", () => {
    const csp = contentSecurityPolicy(false);

    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toMatch(/script-src 'self' 'unsafe-inline'(;|$)/);
  });

  it("solo permite eval en desarrollo", () => {
    expect(contentSecurityPolicy(true)).toContain("'unsafe-eval'");
    expect(contentSecurityPolicy(false)).not.toContain("'unsafe-eval'");
  });
});

describe("securityHeaders", () => {
  it("activa HSTS solo en producción", () => {
    expect(valor(false, "Strict-Transport-Security")).toBeDefined();
    expect(valor(true, "Strict-Transport-Security")).toBeUndefined();
  });

  it("siempre desactiva el sniffing y el enmarcado", () => {
    expect(valor(true, "X-Content-Type-Options")).toBe("nosniff");
    expect(valor(true, "X-Frame-Options")).toBe("DENY");
  });
});
