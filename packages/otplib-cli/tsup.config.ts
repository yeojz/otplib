import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    target: "node20",
  },
  {
    entry: {
      "bin/otplib": "src/otplib/cli.ts",
      "bin/otplibx": "src/otplibx/cli.ts",
    },
    format: ["cjs"],
    splitting: false,
    sourcemap: true,
    target: "node20",
    shims: true,
    banner: { js: "#!/usr/bin/env node" },
  },
]);
