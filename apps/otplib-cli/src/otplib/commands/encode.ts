import fs from "node:fs";

import { parseAddInput } from "../../shared/parse.js";
import { encodePayload, generateUid } from "../../shared/types.js";

import type { ReadStdinFn } from "../../shared/stdin.js";
import type { OtpPayload } from "../../shared/types.js";
import type { Command } from "commander";

export type EncodeResult = {
  id: string;
  encoded: string;
};

export function encode(input: string, bytes = 4): EncodeResult {
  if (!input) {
    throw new Error("expected otpauth URI or JSON from stdin");
  }

  if (bytes < 1 || bytes > 32) {
    throw new Error("bytes must be between 1 and 32");
  }

  const data = parseAddInput(input);
  const id = generateUid(bytes);
  const payload: OtpPayload = { data };
  const encoded = encodePayload(payload);

  return { id, encoded };
}

export function registerEncodeCommand(program: Command, readStdinFn: ReadStdinFn): void {
  program
    .command("encode")
    .description("Encode otpauth URI or JSON into internal format with UID")
    .option("--save-uid <file>", "Append generated UID to file")
    .option("-b, --bytes <n>", "Byte length for UID entropy (default: 4)", "4")
    .action(async (options: { saveUid?: string; bytes: string }) => {
      const raw = await readStdinFn();
      if (!raw) {
        console.error("Error: Expected otpauth URI or JSON from stdin");
        console.error("Usage: cat otp-uri.txt | otplib encode");
        console.error("       pbpaste | otplib encode");
        process.exitCode = 1;
        return;
      }

      try {
        const bytes = parseInt(options.bytes, 10);
        if (isNaN(bytes)) {
          console.error("Error: --bytes must be between 1 and 32");
          process.exitCode = 1;
          return;
        }

        const { id, encoded } = encode(raw, bytes);
        const output = `${id.toUpperCase()}=${encoded}`;

        process.stdout.write(output + "\n");

        if (options.saveUid) {
          try {
            const fd = fs.openSync(options.saveUid, "a", 0o600);
            fs.writeSync(fd, id + "\n");
            fs.closeSync(fd);
          } catch (err) {
            console.error(
              `\nWarning: Could not save UID to ${options.saveUid}: ${(err as Error).message}`,
            );
            process.exitCode = 1;
          }
        }
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
