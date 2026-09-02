import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    serverActions: {
      // El límite por defecto es 1 MB y la biblioteca admite archivos de 5 MB.
      bodySizeLimit: "6mb",
    },
  },
  /* config options here */
};

export default nextConfig;
