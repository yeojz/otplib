import { defineConfig } from "tsdown";

const isProduction = process.env.NODE_ENV === "production" || process.env.CI === "true";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    errors: "src/errors.ts",
    utils: "src/utils.ts",
    types: "src/types.ts",
  },
  format: ["cjs", "esm"],
  // Emit ESM as .js/.d.ts and CJS as .cjs/.d.cts to match the package "exports" map
  // (tsup behaviour). Without this, tsdown defaults to .mjs/.cjs on node platform.
  fixedExtension: false,
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  minify: isProduction,
});
