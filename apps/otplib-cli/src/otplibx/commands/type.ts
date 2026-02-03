import { type as typeCore } from "../../otplib/commands/type.js";
import { parseEnvInput } from "../../shared/parse.js";
import storage from "../storage/index.js";

import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

export type TypeOptions = {
  file: string;
};

export async function type(id: string, options: TypeOptions): Promise<string> {
  const { file } = options;

  if (!id) {
    throw new Error("missing required argument: <id>");
  }

  const decrypted = await storage.load(file);
  const raw = JSON.stringify(decrypted);
  const env = parseEnvInput(raw);

  return typeCore(env, id);
}

export function registerTypeCommand(program: Command, readStdinFn: ReadStdinFn): void {
  program
    .command("type")
    .description("Output entry type (totp or hotp)")
    .argument("[id]", "Entry ID (or read from stdin)")
    .option("-n, --no-newline", "Omit trailing newline")
    .action(async (idArg: string | undefined, cmdOpts: { newline: boolean }) => {
      const opts = program.opts<{ file: string }>();

      try {
        const id = idArg || (await readStdinFn()).trim();
        if (!id) {
          console.error("error: missing entry ID");
          process.exitCode = 1;
          return;
        }

        const result = await type(id, { file: opts.file });
        process.stdout.write(cmdOpts.newline ? result + "\n" : result);
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
