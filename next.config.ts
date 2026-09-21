import type { NextConfig } from "next";

import { contentSecurityPolicy, securityHeaders } from "./src/lib/security-headers";

const dev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    serverActions: {
      // El límite por defecto es 1 MB y la biblioteca admite archivos de 5 MB.
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders(dev) },
      // La API devuelve JSON y archivos: la CSP no aporta nada ahí y
      // `object-src 'none'` impediría a Chrome abrir los PDF.
      {
        source: "/((?!api/).*)",
        headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy(dev) }],
      },
    ];
  },
};

export default nextConfig;
