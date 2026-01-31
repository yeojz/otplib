import { fuzzyMatch } from "../../shared/fuzzy.js";
import { parseEnvInput } from "../../shared/parse.js";
import { getLabel } from "../../shared/types.js";

import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

export function registerListCommand(program: Command, readStdinFn: ReadStdinFn): void {
  program
    .command("list")
    .description("List OTP entries (reads JSON from stdin)")
    .option("-f, --filter <query>", "Fuzzy filter by ID or label")
    .action(async (options: { filter?: string }) => {
      const raw = await readStdinFn();
      if (!raw) {
        console.error("Error: Expected JSON from stdin");
        console.error("Usage: cat storage.json | otplib list");
        process.exitCode = 1;
        return;
      }

      try {
        const { entries } = parseEnvInput(raw);

        if (entries.length === 0) {
          console.log("No entries");
          return;
        }

        const query = options.filter;
        const filtered = query
          ? entries.filter((entry) => {
              const label = getLabel(entry.payload.data);
              return fuzzyMatch(query, entry.id) || fuzzyMatch(query, label);
            })
          : entries;

        if (filtered.length === 0) {
          console.log("No matches");
          return;
        }

        for (const entry of filtered) {
          const label = getLabel(entry.payload.data);
          const type = entry.payload.data.type;
          process.stdout.write(`${label}\t${entry.id}\t${type}\n`);
        }
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
