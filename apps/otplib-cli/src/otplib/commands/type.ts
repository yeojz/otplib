import { findEntry, parseEnvInput } from "../../shared/parse.js";

import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

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
        console.error("Usage: cat secrets.json | otplib type <id>");
        process.exitCode = 1;
        return;
      }

      try {
        const { entries } = parseEnvInput(raw);
        const entry = findEntry(entries, id);

        if (!entry) {
          console.error(`Error: Entry not found: ${id}`);
          process.exitCode = 1;
          return;
        }

        const type = entry.payload.data.type;
        process.stdout.write(options.newline ? type + "\n" : type);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
