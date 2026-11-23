import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    setupFiles: ["src/tests/setup.ts"],
    // Os testes de integração compartilham o mesmo banco: rodam um arquivo por vez.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      // Somente os testes ficam fora da medição (nenhuma camada é excluída).
      exclude: ["src/tests/**"],
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 60,
        branches: 60,
      },
    },
  },
});
