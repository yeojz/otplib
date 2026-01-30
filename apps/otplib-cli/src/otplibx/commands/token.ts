import { requireCommand, runDotenvx, runOtplib } from "../utils/exec.js";

import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

export type TokenOptions = {
  file: string;
  newline: boolean;
};

export function token(id: string, options: TokenOptions): string {
  requireCommand("otplib");
  requireCommand("dotenvx");

  const { file, newline } = options;

  if (!id) {
    throw new Error("missing required argument: <id>");
  }

  const dotenvxResult = runDotenvx(["get", "-f", file]);
  if (dotenvxResult.status !== 0) {
    throw new Error(`dotenvx get failed: ${dotenvxResult.stderr}`);
  }

  const otplibArgs = ["token"];
  if (!newline) {
    otplibArgs.push("-n");
  }
  otplibArgs.push(id);

  const otplibResult = runOtplib(otplibArgs, { stdin: dotenvxResult.stdout });
  if (otplibResult.status !== 0) {
    throw new Error(otplibResult.stderr || `otplib token failed`);
  }

  return otplibResult.stdout;
}

export function registerTokenCommand(program: Command, readStdinFn: ReadStdinFn): void {
  program
    .command("token")
    .description("Generate OTP token for an entry")
    .argument("[id]", "Entry ID (or read from stdin)")
    .option("-n, --no-newline", "Omit trailing newline")
    .action(async (idArg: string | undefined, cmdOpts: { newline: boolean }) => {
      const opts = program.opts<{ file: string }>();

      try {
        const id = idArg || (await readStdinFn()).trim();
        if (!id) {
          console.error("error: missing entry ID");
          process.exitCode = 1;
          return;
        }

        const result = token(id, { file: opts.file, newline: cmdOpts.newline });
        process.stdout.write(cmdOpts.newline ? result + "\n" : result);
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
