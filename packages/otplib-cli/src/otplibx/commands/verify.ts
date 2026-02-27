import { verify as verifyCore } from "../../otplib/commands/verify.js";
import { parseEnvInput } from "../../shared/parse.js";
import storage from "../storage/index.js";

import type { Command } from "commander";

export type VerifyOptions = {
  file: string;
};

export async function verify(id: string, token: string, options: VerifyOptions): Promise<boolean> {
  const { file } = options;

  if (!id) {
    throw new Error("missing required argument: <id>");
  }
  if (!token) {
    throw new Error("missing required argument: <token>");
  }

  const decrypted = await storage.load(file);
  const raw = JSON.stringify(decrypted);
  const env = parseEnvInput(raw);

  return verifyCore(env, id, token);
}

export function registerVerifyCommand(program: Command): void {
  program
    .command("verify")
    .description("Verify a token against an entry")
    .argument("<id>", "Entry ID")
    .argument("<token>", "Token to verify (6-8 digits)")
    .action(async (id: string, token: string) => {
      const opts = program.opts<{ file: string }>();

      try {
        const valid = await verify(id, token, { file: opts.file });
        if (!valid) {
          process.exitCode = 1;
        }
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
