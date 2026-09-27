import { defineConfig } from "tsdown";

const isProduction = process.env.NODE_ENV === "production" || process.env.CI === "true";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  // tsdown defaults to .mjs on the node platform; the package exports .js for ESM.
  fixedExtension: false,
  // tsconfig enables declarationMap, but the maps would point at sources that are not published.
  dts: { sourcemap: false },
  // rolldown-plugin-dts drops an emptied export list, which would make every top-level declaration public.
  footer: { dts: "export {};" },
  sourcemap: true,
  clean: true,
  target: "es2022",
  minify: isProduction,
  // Keep named-exports CommonJS like tsup: never collapse module.exports to a default export.
  cjsDefault: false,
  // Match tsup's CommonJS shape: strict mode, always __esModule, no Symbol.toStringTag.
  outputOptions: { strict: true, esModule: true, generatedCode: { symbols: false } },
});
