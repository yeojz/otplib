import fs from "node:fs";

import { requireCommand, runDotenvx } from "../utils/exec.js";

import type { Command } from "commander";

export type InitOptions = {
  file: string;
};

export function init(options: InitOptions): void {
  requireCommand("dotenvx");

  const { file } = options;

  if (fs.existsSync(file)) {
    throw new Error(`file already exists: ${file}`);
  }

  fs.writeFileSync(file, "", { mode: 0o600 });

  const result = runDotenvx(["encrypt", "-f", file]);
  if (result.status !== 0) {
    fs.unlinkSync(file);
    throw new Error(`dotenvx encrypt failed: ${result.stderr}`);
  }

  console.log(`Initialized: ${file}`);
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize a new encrypted secrets file")
    .argument("[file]", "File path (overrides --file option)")
    .action((fileArg: string | undefined) => {
      const opts = program.opts<{ file: string }>();
      const file = fileArg ?? opts.file;

      try {
        init({ file });
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
