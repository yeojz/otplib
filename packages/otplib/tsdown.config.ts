import { defineConfig } from "tsdown";

const isProduction = process.env.NODE_ENV === "production" || process.env.CI === "true";

// Shared options for the dual CJS/ESM library builds.
const lib = {
  format: ["cjs", "esm"] as const,
  // Emit ESM as .js/.d.ts and CJS as .cjs/.d.cts to match the package "exports" map
  // (tsup behaviour). Without this, tsdown defaults to .mjs/.cjs on node platform.
  fixedExtension: false,
  dts: true,
  sourcemap: true,
  target: "es2022",
  tsconfig: "./tsconfig.json",
  minify: isProduction,
};

// Each public entry is built as its own single-entry bundle. Building them
// separately keeps each entry self-contained (no shared cross-entry chunks),
// preserving tsup's `splitting: false` output layout so the per-entry size
// budgets in release.config.json stay meaningful.
export default defineConfig([
  { ...lib, entry: { index: "src/index.ts" }, clean: true },
  { ...lib, entry: { functional: "src/functional.ts" }, clean: false },
  { ...lib, entry: { class: "src/class.ts" }, clean: false },
  {
    entry: { index: "src/index.ts" },
    format: ["iife"],
    globalName: "otplib",
    noExternal: [/(.*)/],
    sourcemap: true,
    target: "es2022",
    minify: true,
    clean: false,
    outputOptions: {
      entryFileNames: "index.global.js",
    },
  },
]);
