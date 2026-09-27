import { defineConfig, type UserConfig } from "tsdown";

const isProduction = process.env.NODE_ENV === "production" || process.env.CI === "true";

const entries = {
  index: "src/index.ts",
  errors: "src/errors.ts",
  utils: "src/utils.ts",
  types: "src/types.ts",
};

// One JavaScript build per entry keeps every output self-contained, as tsup's `splitting: false` did.
// A single multi-entry build makes rolldown's entries import one another.
const runtimeConfigs: UserConfig[] = Object.entries(entries).map(([name, source]) => ({
  entry: { [name]: source },
  format: ["cjs", "esm"],
  // tsdown defaults to .mjs on the node platform; the package exports .js for ESM.
  fixedExtension: false,
  dts: false,
  sourcemap: true,
  clean: true,
  target: "es2022",
  minify: isProduction,
  // Keep named-exports CommonJS like tsup: never collapse module.exports to a default export.
  cjsDefault: false,
  // Match tsup's CommonJS shape: strict mode, always __esModule, no Symbol.toStringTag.
  outputOptions: { strict: true, esModule: true, generatedCode: { symbols: false } },
}));

// Declarations are bundled across all entries at once, as tsup did, so every subpath shares one
// declaration per type. tsdown only writes .d.cts beside a CommonJS JavaScript build, so each
// extension gets its own declaration-only build.
const declarationConfigs: UserConfig[] = [".js", ".cjs"].map((extension) => ({
  entry: entries,
  format: ["esm"],
  outExtensions: () => ({ js: extension }),
  // tsconfig enables declarationMap, but the maps would point at sources that are not published.
  dts: { emitDtsOnly: true, sourcemap: false },
  // rolldown-plugin-dts drops an emptied export list, which would make every top-level declaration public.
  footer: { dts: "export {};" },
  clean: true,
}));

export default defineConfig([...runtimeConfigs, ...declarationConfigs]);
