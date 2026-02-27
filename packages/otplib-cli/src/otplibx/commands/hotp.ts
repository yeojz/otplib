import { updateCounter as updateCounterCore } from "../../otplib/commands/hotp.js";
import { parseEnvInput } from "../../shared/parse.js";
import storage from "../storage/index.js";

import type { Command } from "commander";

export type UpdateCounterOptions = {
  file: string;
  counter?: number;
};

export async function updateCounter(id: string, options: UpdateCounterOptions): Promise<string> {
  const { file, counter } = options;

  if (!id) {
    throw new Error("missing required argument: <id>");
  }

  const decrypted = await storage.load(file);
  const raw = JSON.stringify(decrypted);
  const env = parseEnvInput(raw);

  const { id: resultId, encoded } = updateCounterCore(env, id, counter);

  await storage.set(file, resultId, encoded);

  return resultId;
}

export function registerHotpCommands(program: Command): void {
  const hotpCmd = program.command("hotp").description("HOTP commands");

  hotpCmd
    .command("update-counter")
    .description("Update HOTP counter")
    .argument("<id>", "Entry ID")
    .argument("[counter]", "New counter value (default: current + 1)")
    .action(async (id: string, counterArg?: string) => {
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
        const result = await updateCounter(id, { file: opts.file, counter });
        console.log(result);
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
