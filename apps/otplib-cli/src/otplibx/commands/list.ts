import { list as listCore } from "../../otplib/commands/list.js";
import { parseEnvInput } from "../../shared/parse.js";
import storage from "../storage/index.js";

import type { Command } from "commander";

export type ListOptions = {
  file: string;
  filter?: string;
};

export async function list(options: ListOptions): Promise<string> {
  const { file, filter } = options;

  const decrypted = await storage.load(file);
  const raw = JSON.stringify(decrypted);
  const env = parseEnvInput(raw);

  return listCore(env, filter);
}

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List all OTP entries")
    .option("--filter <query>", "Fuzzy filter by ID or label")
    .action(async (cmdOpts: { filter?: string }) => {
      const opts = program.opts<{ file: string }>();

      try {
        const result = await list({ file: opts.file, filter: cmdOpts.filter });
        process.stdout.write(result + "\n");
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
