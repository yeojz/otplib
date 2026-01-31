import { requireCommand, runDotenvx, runOtplib } from "../utils/exec.js";

import type { Command } from "commander";

export type VerifyOptions = {
  file: string;
};

export function verify(id: string, token: string, options: VerifyOptions): boolean {
  requireCommand("otplib");
  requireCommand("dotenvx");

  const { file } = options;

  if (!id) {
    throw new Error("missing required argument: <id>");
  }
  if (!token) {
    throw new Error("missing required argument: <token>");
  }

  const dotenvxResult = runDotenvx(["get", "-f", file]);
  if (dotenvxResult.status !== 0) {
    throw new Error(`dotenvx get failed: ${dotenvxResult.stderr}`);
  }

  const otplibResult = runOtplib(["verify", id, token], { stdin: dotenvxResult.stdout });
  if (otplibResult.status !== 0) {
    if (otplibResult.stderr) {
      throw new Error(otplibResult.stderr);
    }
    return false;
  }

  return true;
}

export function registerVerifyCommand(program: Command): void {
  program
    .command("verify")
    .description("Verify a token against an entry")
    .argument("<id>", "Entry ID")
    .argument("<token>", "Token to verify (6-8 digits)")
    .action((id: string, token: string) => {
      const opts = program.opts<{ file: string }>();

      try {
        const valid = verify(id, token, { file: opts.file });
        if (!valid) {
          process.exitCode = 1;
        }
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
