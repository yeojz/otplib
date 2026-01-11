import { defineConfig } from "tsup";

const isProduction = process.env.NODE_ENV === "production" || process.env.CI === "true";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    functional: "src/functional.ts",
    class: "src/class.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "es2022",
  tsconfig: "./tsconfig.json",
  minify: isProduction,
  metafile: true,
});
