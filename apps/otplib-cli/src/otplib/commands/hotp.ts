import { findEntry, parseEnvInput, updateHotpCounter } from "../../shared/parse.js";
import { formatOutput } from "../../shared/types.js";

import type { ReadStdinFn } from "../../shared/stdin.js";
import type { HotpData, OtpPayload } from "../../shared/types.js";
import type { Command } from "commander";

export function registerHotpCommands(program: Command, readStdinFn: ReadStdinFn): void {
  const hotpCmd = program.command("hotp").description("HOTP commands");

  hotpCmd
    .command("update-counter")
    .description("Output updated HOTP entry with new counter")
    .argument("<id>", "Entry ID")
    .argument("[n]", "New counter value (default: current + 1)")
    .action(async (id: string, n?: string) => {
      const raw = await readStdinFn();
      if (!raw) {
        console.error("Error: Expected JSON from stdin");
        console.error("Usage: cat storage.json | otplib hotp update-counter <id>");
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

        if (entry.payload.data.type !== "hotp") {
          console.error(`Error: Entry ${id} is TOTP, not HOTP`);
          process.exitCode = 1;
          return;
        }

        let newCounter: number | undefined;
        if (n !== undefined) {
          newCounter = parseInt(n, 10);
          if (isNaN(newCounter) || newCounter < 0) {
            console.error("Error: Counter must be a non-negative integer");
            process.exitCode = 1;
            return;
          }
        }

        const updatedData = updateHotpCounter(entry.payload.data as HotpData, newCounter);
        const payload: OtpPayload = { data: updatedData };
        const output = formatOutput(id, payload);
        process.stdout.write(output + "\n");
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
