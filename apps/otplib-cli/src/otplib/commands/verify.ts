import { verifyOtp } from "../../shared/otp.js";
import { findEntry, parseEnvInput } from "../../shared/parse.js";

import type { ParsedEnv } from "../../shared/parse.js";
import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

export async function verify(env: ParsedEnv, id: string, token: string): Promise<boolean> {
  const entry = findEntry(env.entries, id);
  if (!entry) {
    throw new Error(`entry not found: ${id}`);
  }
  return verifyOtp(entry.payload.data, token, env.guardrails);
}

export function registerVerifyCommand(program: Command, readStdinFn: ReadStdinFn): void {
  program
    .command("verify")
    .description("Verify a token against an entry")
    .argument("<id>", "Entry ID")
    .argument("<token>", "Token to verify (6-8 digits)")
    .action(async (id: string, tokenArg: string) => {
      const raw = await readStdinFn();
      if (!raw) {
        console.error("Error: Expected JSON from stdin");
        console.error("Usage: cat storage.json | otplib verify <id> <token>");
        process.exitCode = 1;
        return;
      }

      try {
        const env = parseEnvInput(raw);
        const valid = await verify(env, id, tokenArg);
        if (!valid) {
          process.exitCode = 1;
        }
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
