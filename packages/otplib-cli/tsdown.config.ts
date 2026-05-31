import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/otplib/cli.ts",
    otplibx: "src/otplibx/cli.ts",
  },
  format: ["cjs"],
  // CLI bins only — no type declarations (tsdown would otherwise auto-enable dts).
  dts: false,
  clean: true,
  sourcemap: true,
  target: "node20",
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
