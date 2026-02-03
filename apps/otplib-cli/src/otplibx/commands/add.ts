import { encode } from "../../otplib/commands/encode.js";
import storage from "../storage/index.js";

import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

export type AddOptions = {
  file: string;
  bytes?: number;
};

export async function add(input: string, options: AddOptions): Promise<string> {
  const { file, bytes } = options;

  const { id, encoded } = encode(input, bytes);

  await storage.set(file, id, encoded);

  return id;
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
        const key = await add(input, { file: opts.file, bytes });
        console.log(key);
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
