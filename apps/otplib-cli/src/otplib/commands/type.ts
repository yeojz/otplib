import { findEntry, parseEnvInput } from "../../shared/parse.js";

import type { ParsedEnv } from "../../shared/parse.js";
import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

export function type(env: ParsedEnv, id: string): string {
  const entry = findEntry(env.entries, id);
  if (!entry) {
    throw new Error(`entry not found: ${id}`);
  }
  return entry.payload.data.type;
}

export function registerTypeCommand(program: Command, readStdinFn: ReadStdinFn): void {
  program
    .command("type")
    .description("Output entry type (totp or hotp)")
    .argument("<id>", "Entry ID")
    .option("-n, --no-newline", "Omit trailing newline")
    .action(async (id: string, options: { newline: boolean }) => {
      const raw = await readStdinFn();
      if (!raw) {
        console.error("Error: Expected JSON from stdin");
        console.error("Usage: cat storage.json | otplib type <id>");
        process.exitCode = 1;
        return;
      }

      try {
        const env = parseEnvInput(raw);
        const result = type(env, id);
        process.stdout.write(options.newline ? result + "\n" : result);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
