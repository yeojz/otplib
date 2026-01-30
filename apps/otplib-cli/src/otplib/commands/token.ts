import { generateOtp } from "../../shared/otp.js";
import { findEntry, parseEnvInput } from "../../shared/parse.js";

import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

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
        console.error("Usage: cat secrets.json | otplib token <id>");
        process.exitCode = 1;
        return;
      }

      try {
        const { entries, guardrails } = parseEnvInput(raw);
        const entry = findEntry(entries, id);

        if (!entry) {
          console.error(`Error: Entry not found: ${id}`);
          process.exitCode = 1;
          return;
        }

        const code = await generateOtp(entry.payload.data, guardrails);
        process.stdout.write(options.newline ? code + "\n" : code);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
