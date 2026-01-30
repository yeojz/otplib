import { requireCommand, runDotenvx, runOtplib } from "../utils/exec.js";

import type { Command } from "commander";

export type ListOptions = {
  file: string;
  filter?: string;
};

export function list(options: ListOptions): string {
  requireCommand("otplib");
  requireCommand("dotenvx");

  const { file, filter } = options;

  const dotenvxResult = runDotenvx(["get", "-f", file]);
  if (dotenvxResult.status !== 0) {
    throw new Error(`dotenvx get failed: ${dotenvxResult.stderr}`);
  }

  const otplibArgs = ["list"];
  if (filter) {
    otplibArgs.push("--filter", filter);
  }

  const otplibResult = runOtplib(otplibArgs, { stdin: dotenvxResult.stdout });
  if (otplibResult.status !== 0) {
    throw new Error(`otplib list failed: ${otplibResult.stderr}`);
  }

  return otplibResult.stdout;
}

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List all OTP entries")
    .option("--filter <query>", "Fuzzy filter by ID or label")
    .action((cmdOpts: { filter?: string }) => {
      const opts = program.opts<{ file: string }>();

      try {
        const result = list({ file: opts.file, filter: cmdOpts.filter });
        if (result) {
          process.stdout.write(result);
        }
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
