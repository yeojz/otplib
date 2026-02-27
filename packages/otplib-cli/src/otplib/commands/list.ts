import { fuzzyMatch } from "../../shared/fuzzy.js";
import { parseEnvInput } from "../../shared/parse.js";
import { getLabel } from "../../shared/types.js";

import type { ParsedEnv } from "../../shared/parse.js";
import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

export function list(env: ParsedEnv, filter?: string): string {
  if (env.entries.length === 0) {
    return "No entries";
  }

  const filtered = filter
    ? env.entries.filter((entry) => {
        const label = getLabel(entry.payload.data);
        return fuzzyMatch(filter, entry.id) || fuzzyMatch(filter, label);
      })
    : env.entries;

  if (filtered.length === 0) {
    return "No matches";
  }

  const lines: string[] = [];
  for (const entry of filtered) {
    const label = getLabel(entry.payload.data);
    const entryType = entry.payload.data.type;
    lines.push(`${label}\t${entry.id}\t${entryType}`);
  }

  return lines.join("\n");
}

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
        const env = parseEnvInput(raw);
        const result = list(env, options.filter);

        if (result === "No entries" || result === "No matches") {
          console.log(result);
        } else {
          for (const line of result.split("\n")) {
            process.stdout.write(line + "\n");
          }
        }
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
