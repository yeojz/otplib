import { defineConfig, type UserConfig } from "tsdown";

const entries = {
  index: "src/otplib/cli.ts",
  otplibx: "src/otplibx/cli.ts",
};

// One build per bin keeps each executable self-contained, with no shared chunk carrying the shebang.
const binConfigs: UserConfig[] = Object.entries(entries).map(([name, source]) => ({
  entry: { [name]: source },
  format: ["cjs"],
  // tsdown enables declarations when tsconfig sets `declaration`; the CLI ships none.
  dts: false,
  clean: true,
  sourcemap: true,
  target: "node22",
  banner: "#!/usr/bin/env node",
  // rolldown only emits "use strict" when the source has it; tsup always did for CommonJS.
  outputOptions: { strict: true },
}));

export default defineConfig(binConfigs);
