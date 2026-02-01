import path from "path";
import { fileURLToPath } from "url";

import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

/**
 * Distribution tests configuration
 *
 * Unlike the main vitest config, this does NOT alias packages to source.
 * Instead, it resolves to the built dist/ directories to verify the
 * actual published artifacts work correctly.
 */
export default defineConfig({
  resolve: {
    alias: {
      // Only alias internal testing utilities to source
      "@repo/testing": path.resolve(rootDir, "internal/testing/src"),
    },
  },
  test: {
    name: "distribution",
    root: __dirname,
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/*.bun.test.ts", "**/*.deno.test.ts"],
  },
});
