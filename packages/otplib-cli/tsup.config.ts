import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/otplib/cli.ts",
    otplibx: "src/otplibx/cli.ts",
  },
  format: ["cjs"],
  clean: true,
  sourcemap: true,
  target: "node22",
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
