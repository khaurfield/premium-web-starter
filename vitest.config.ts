import path from "node:path";
import { defineConfig } from "vitest/config";

const root = process.cwd();

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
      // `server-only` throws outside React Server Components; unit tests run in
      // plain Node, so the guard is replaced with an inert module.
      "server-only": path.join(root, "tests/stubs/server-only.ts"),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts", "components/**/*.tsx", "app/api/**/*.ts"],
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
    },
  },
});
