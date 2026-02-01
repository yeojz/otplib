import fs from "node:fs";
import path from "node:path";

import { deduplicateKeys } from "../utils/dedup.js";
import { requireCommand, runDotenvx, runOtplib } from "../utils/exec.js";

import type { Command } from "commander";

export type UpdateCounterOptions = {
  file: string;
  counter?: number;
};

export function updateCounter(id: string, options: UpdateCounterOptions): string {
  requireCommand("otplib");
  requireCommand("dotenvx");

  const { file, counter } = options;

  if (!id) {
    throw new Error("missing required argument: <id>");
  }

  const dotenvxResult = runDotenvx(["get", "-f", file]);
  if (dotenvxResult.status !== 0) {
    throw new Error(`dotenvx get failed: ${dotenvxResult.stderr}`);
  }

  const otplibArgs = ["hotp", "update-counter", id];
  if (counter !== undefined) {
    otplibArgs.push(String(counter));
  }

  const otplibResult = runOtplib(otplibArgs, { stdin: dotenvxResult.stdout });
  if (otplibResult.status !== 0) {
    throw new Error(`update failed: ${otplibResult.stderr}`);
  }

  const output = otplibResult.stdout;
  if (!output) {
    throw new Error("failed to parse updated entry from otplib output");
  }

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

    const encryptResult =
      runDotenvx(["encrypt", "-f", tempFile]) ?? ({ stdout: "", stderr: "", status: 0 } as const);
    if (encryptResult.status !== 0) {
      throw new Error(`dotenvx encrypt failed: ${encryptResult.stderr}`);
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

export function registerHotpCommands(program: Command): void {
  const hotpCmd = program.command("hotp").description("HOTP commands");

  hotpCmd
    .command("update-counter")
    .description("Update HOTP counter")
    .argument("<id>", "Entry ID")
    .argument("[counter]", "New counter value (default: current + 1)")
    .action((id: string, counterArg?: string) => {
      const opts = program.opts<{ file: string }>();
      let counter: number | undefined;

      if (counterArg !== undefined) {
        counter = parseInt(counterArg, 10);
        if (isNaN(counter) || counter < 0) {
          console.error("error: counter must be a non-negative integer");
          process.exitCode = 1;
          return;
        }
      }

      try {
        const result = updateCounter(id, { file: opts.file, counter });
        console.log(result);
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
