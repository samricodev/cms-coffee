import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    // Las pruebas de integración comparten una base de datos: si corrieran en
    // paralelo se pisarían al limpiarla entre casos.
    fileParallelism: false,
  },
});
