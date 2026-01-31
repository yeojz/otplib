import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/otplib/index.ts",
    otplibx: "src/otplibx/index.ts",
  },
  format: ["cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node20",
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
