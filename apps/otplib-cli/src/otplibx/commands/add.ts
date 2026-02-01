import fs from "node:fs";
import path from "node:path";

import { deduplicateKeys } from "../utils/dedup.js";
import { requireCommand, runDotenvx, runOtplib } from "../utils/exec.js";

import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

export type AddOptions = {
  file: string;
  bytes?: number;
};

export function add(input: string, options: AddOptions): string {
  requireCommand("otplib");
  requireCommand("dotenvx");

  const { file, bytes } = options;

  if (!input) {
    throw new Error("expected otpauth URI or JSON from stdin");
  }

  const args = ["encode"];
  if (bytes !== undefined) {
    args.push("--bytes", String(bytes));
  }
  const otplibResult = runOtplib(args, { stdin: input });
  if (otplibResult.status !== 0) {
    throw new Error(`otplib add failed: ${otplibResult.stderr}`);
  }

  const output = otplibResult.stdout;
  const eqIndex = output.indexOf("=");
  if (eqIndex === -1) {
    throw new Error("failed to parse key from otplib output");
  }

  const key = output.substring(0, eqIndex);
  const value = output.substring(eqIndex + 1);

  if (!key) {
    throw new Error("failed to parse key from otplib output");
  }
  if (!value) {
    throw new Error("failed to parse value from otplib output");
  }

  const parentDir = path.dirname(file);
  const tempDir = fs.mkdtempSync(path.join(parentDir, ".otplibx-"));
  const tempFile = path.join(tempDir, path.basename(file));

  try {
    let existingContents = "";
    try {
      existingContents = fs.readFileSync(file, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }

    const nextContents = `${existingContents}${
      existingContents && !existingContents.endsWith("\n") ? "\n" : ""
    }${key}=${value}\n`;

    try {
      // Write to a temp file to avoid exposing secret in process list (argv)
      // dotenvx encrypt will pick it up and encrypt it
      fs.writeFileSync(tempFile, nextContents);
    } catch (err) {
      throw new Error(`failed to write to ${file}: ${(err as Error).message}`);
    }

    const dotenvxResult = runDotenvx(["encrypt", "-f", tempFile]);
    if (dotenvxResult.status !== 0) {
      throw new Error(`dotenvx encrypt failed: ${dotenvxResult.stderr}`);
    }

    fs.renameSync(tempFile, file);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  try {
    deduplicateKeys(file);
  } catch (err) {
    // Non-fatal, just warn
    console.error(`warning: deduplication failed: ${(err as Error).message}`);
  }

  return key;
}

export function registerAddCommand(program: Command, readStdinFn: ReadStdinFn): void {
  program
    .command("add")
    .description("Add OTP entry (reads otpauth URI or JSON from stdin)")
    .option("-b, --bytes <n>", "Byte length for UID entropy (default: 4)")
    .action(async (cmdOpts: { bytes?: string }) => {
      const opts = program.opts<{ file: string }>();
      const input = await readStdinFn();
      const bytes = cmdOpts.bytes ? parseInt(cmdOpts.bytes, 10) : undefined;

      if (bytes !== undefined && (isNaN(bytes) || bytes < 1 || bytes > 32)) {
        console.error("error: --bytes must be between 1 and 32");
        process.exitCode = 1;
        return;
      }

      try {
        const key = add(input, { file: opts.file, bytes });
        console.log(key);
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
