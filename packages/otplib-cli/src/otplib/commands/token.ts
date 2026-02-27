import { generateOtp } from "../../shared/otp.js";
import { findEntry, parseEnvInput } from "../../shared/parse.js";

import type { ParsedEnv } from "../../shared/parse.js";
import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

export async function token(env: ParsedEnv, id: string): Promise<string> {
  const entry = findEntry(env.entries, id);
  if (!entry) {
    throw new Error(`entry not found: ${id}`);
  }
  return generateOtp(entry.payload.data, env.guardrails);
}

export function registerTokenCommand(program: Command, readStdinFn: ReadStdinFn): void {
  program
    .command("token")
    .description("Generate OTP token (auto-detects TOTP/HOTP)")
    .argument("<id>", "Entry ID")
    .option("-n, --no-newline", "Omit trailing newline")
    .action(async (id: string, options: { newline: boolean }) => {
      const raw = await readStdinFn();
      if (!raw) {
        console.error("Error: Expected JSON from stdin");
        console.error("Usage: cat storage.json | otplib token <id>");
        process.exitCode = 1;
        return;
      }

      try {
        const env = parseEnvInput(raw);
        const code = await token(env, id);
        process.stdout.write(options.newline ? code + "\n" : code);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
