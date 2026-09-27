import type { UserConfig } from "tsdown";

/** Output name to source path, e.g. `{ index: "src/index.ts" }`. */
type Entries = Record<string, string>;

// Match tsup's CommonJS and IIFE shape: strict mode, always __esModule, no Symbol.toStringTag.
const exportShape = { strict: true, esModule: true, generatedCode: { symbols: false } };

// rolldown-plugin-dts drops an emptied export list, which would make every top-level declaration public.
const declarationFooter = { dts: "export {};" };

function isProductionBuild(): boolean {
  return process.env.NODE_ENV === "production" || process.env.CI === "true";
}

function javascriptOptions(): UserConfig {
  return {
    format: ["cjs", "esm"],
    // tsdown defaults to .mjs on the node platform; the packages export .js for ESM.
    fixedExtension: false,
    sourcemap: true,
    target: "es2022",
    minify: isProductionBuild(),
    // Keep named-exports CommonJS like tsup: never collapse module.exports to a default export.
    cjsDefault: false,
    outputOptions: exportShape,
  };
}

function declarationConfig(entries: Entries, extension: ".js" | ".cjs"): UserConfig {
  return {
    entry: entries,
    format: ["esm"],
    outExtensions: () => ({ js: extension }),
    // tsconfig enables declarationMap, but the maps would point at sources that are not published.
    dts: { emitDtsOnly: true, sourcemap: false },
    footer: declarationFooter,
  };
}

/** CommonJS and ESM builds of a published library, with .d.ts and .d.cts declarations. */
// One JavaScript build per entry keeps every output self-contained, as tsup's `splitting: false`
// did; a single multi-entry build makes rolldown's entries import one another. Declarations are
// bundled across all entries at once so every subpath shares one declaration per type, and tsdown
// only writes .d.cts beside a CommonJS JavaScript build, so each extension gets its own
// declaration-only build.
export function libraryConfigs(entries: Entries): UserConfig[] {
  const javascriptConfigs = Object.entries(entries).map(([name, source]) => ({
    entry: { [name]: source },
    ...javascriptOptions(),
    dts: false,
  }));
  return [
    ...javascriptConfigs,
    declarationConfig(entries, ".js"),
    declarationConfig(entries, ".cjs"),
  ];
}

/** Minified IIFE bundle for script tags and CDNs, with every dependency inlined. */
export function browserBundleConfig(entries: Entries, globalName: string): UserConfig {
  return {
    entry: entries,
    format: ["iife"],
    globalName,
    deps: { alwaysBundle: [/(.*)/] },
    // tsdown enables declarations whenever package.json declares types; the IIFE ships none.
    dts: false,
    sourcemap: true,
    target: "es2022",
    minify: true,
    // tsdown names IIFE output [name].iife.js; the browser/unpkg/jsdelivr fields expect [name].global.js.
    outputOptions: { ...exportShape, entryFileNames: "[name].global.js" },
  };
}

// Separate builds keep each executable self-contained, with no shared chunk carrying the shebang.
/** One CommonJS executable per bin. */
export function cliConfigs(bins: Entries): UserConfig[] {
  return Object.entries(bins).map(([name, source]) => ({
    entry: { [name]: source },
    format: ["cjs"],
    // tsdown enables declarations when tsconfig sets `declaration`; the CLI ships none.
    dts: false,
    sourcemap: true,
    target: "node22",
    banner: "#!/usr/bin/env node",
    // rolldown only emits "use strict" when the source has it; tsup always did for CommonJS.
    outputOptions: { strict: true },
  }));
}
