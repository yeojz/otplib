import { defineConfig } from "tsup";

const isProduction = process.env.NODE_ENV === "production" || process.env.CI === "true";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    errors: "src/errors.ts",
    utils: "src/utils.ts",
    types: "src/types.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "es2022",
  minify: isProduction,
  metafile: true,
});
