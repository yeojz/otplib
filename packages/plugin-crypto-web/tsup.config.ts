import { defineConfig } from "tsup";

const isProduction = process.env.NODE_ENV === "production" || process.env.CI === "true";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "es2022",
  minify: isProduction,
});
