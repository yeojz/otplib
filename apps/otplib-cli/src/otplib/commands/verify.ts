import { verifyOtp } from "../../shared/otp.js";
import { findEntry, parseEnvInput } from "../../shared/parse.js";

import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

export function registerVerifyCommand(program: Command, readStdinFn: ReadStdinFn): void {
  program
    .command("verify")
    .description("Verify a token against an entry")
    .argument("<id>", "Entry ID")
    .argument("<token>", "Token to verify (6-8 digits)")
    .action(async (id: string, token: string) => {
      const raw = await readStdinFn();
      if (!raw) {
        console.error("Error: Expected JSON from stdin");
        console.error("Usage: cat secrets.json | otplib verify <id> <token>");
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

        const valid = await verifyOtp(entry.payload.data, token, guardrails);
        if (!valid) {
          process.exitCode = 1;
        }
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
