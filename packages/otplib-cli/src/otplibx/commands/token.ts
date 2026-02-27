import { token as tokenCore } from "../../otplib/commands/token.js";
import { parseEnvInput } from "../../shared/parse.js";
import storage from "../storage/index.js";

import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

export type TokenOptions = {
  file: string;
};

export async function token(id: string, options: TokenOptions): Promise<string> {
  const { file } = options;

  if (!id) {
    throw new Error("missing required argument: <id>");
  }

  const decrypted = await storage.load(file);
  const raw = JSON.stringify(decrypted);
  const env = parseEnvInput(raw);

  return tokenCore(env, id);
}

export function registerTokenCommand(program: Command, readStdinFn: ReadStdinFn): void {
  program
    .command("token")
    .description("Generate OTP token for an entry")
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

        const result = await token(id, { file: opts.file });
        process.stdout.write(cmdOpts.newline ? result + "\n" : result);
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
