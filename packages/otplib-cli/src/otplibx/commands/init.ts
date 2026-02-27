import storage from "../storage/index.js";

import type { Command } from "commander";

export type InitOptions = {
  file: string;
};

export async function init(options: InitOptions): Promise<void> {
  const { file } = options;

  await storage.init(file);

  console.log(`Initialized: ${file}`);
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize a new encrypted secrets file")
    .argument("[file]", "File path (overrides --file option)")
    .action(async (fileArg: string | undefined) => {
      const opts = program.opts<{ file: string }>();
      const file = fileArg ?? opts.file;

      try {
        await init({ file });
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
