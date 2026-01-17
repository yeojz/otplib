import path from "path";
import { fileURLToPath } from "url";

import { defineConfig, defineProject } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const alias = {
  "@otplib/core": path.resolve(__dirname, "packages/core/src"),
  "@otplib/base32": path.resolve(__dirname, "packages/base32/src"),
  "@otplib/hotp": path.resolve(__dirname, "packages/hotp/src"),
  "@otplib/totp": path.resolve(__dirname, "packages/totp/src"),
  "@otplib/uri": path.resolve(__dirname, "packages/uri/src"),
  "@otplib/plugin-crypto-node": path.resolve(__dirname, "packages/plugin-crypto-node/src"),
  "@otplib/plugin-crypto-web": path.resolve(__dirname, "packages/plugin-crypto-web/src"),
  "@otplib/plugin-crypto-noble": path.resolve(__dirname, "packages/plugin-crypto-noble/src"),
  "@otplib/plugin-base32-scure": path.resolve(__dirname, "packages/plugin-base32-scure/src"),
  "@repo/testing": path.resolve(__dirname, "internal/testing/src"),
};

export default defineConfig({
  test: {
    // Use github-actions and junit reporters in CI for better integration, default for local CLI
    reporters: process.env.CI ? ["github-actions", "junit"] : ["default"],
    outputFile: {
      junit: "reports/junit.xml",
    },
    // Define multiple projects in the workspace
    projects: [
      // Library packages project (inline)
      defineProject({
        resolve: {
          alias,
        },
        test: {
          name: "packages",
          root: path.resolve(__dirname, "packages"),
          globals: true,
          environment: "node",
          include: ["**/*.test.ts"],
          exclude: ["**/node_modules/**", "dist/**", "**/*.bun.test.ts", "**/*.deno.test.ts"],
        },
      }),
      defineProject({
        resolve: {
          alias,
        },
        test: {
          name: "internal",
          root: path.resolve(__dirname, "internal"),
          globals: true,
          environment: "node",
          include: ["testing/**/*.test.ts"],
          exclude: ["**/node_modules/**", "dist/**"],
        },
      }),
    ],
    // Global coverage settings
    coverage: {
      provider: "v8",
      reporter: process.env.CI
        ? ["text", "json", "lcov", "json-summary"]
        : ["text", "json", "html", "lcov", "json-summary"],
      include: ["packages/*/src/**/*.ts", "apps/otplib-cli/src/**/*.{ts,tsx}"],
      exclude: [
        "node_modules/",
        "dist/**",
        "**/*.test.{ts,tsx}",
        "**/index-test.ts",
        "**/*.spec.ts",
        "**/*.d.ts",
        "tests/**",
      ],
      thresholds: {
        "packages/*/src/**": {
          lines: 100,
          branches: 100,
          functions: 100,
          statements: 100,
        },
      },
    },
  },
});
