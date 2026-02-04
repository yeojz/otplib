import { guardShow as guardShowCore } from "../../otplib/commands/guard.js";
import { normalizeGuardrailKey, validateGuardrailValue } from "../../shared/guardrails.js";
import { parseEnvInput } from "../../shared/parse.js";
import storage from "../storage/index.js";

import type { ParsedEnv } from "../../shared/parse.js";
import type { Command } from "commander";

export type GuardUpdateOptions = {
  file: string;
};

export async function guardUpdate(
  key: string,
  value: string,
  options: GuardUpdateOptions,
): Promise<string> {
  const { file } = options;

  if (!key) {
    throw new Error("missing required argument: <key>");
  }
  if (!value) {
    throw new Error("missing required argument: <value>");
  }

  validateGuardrailValue(value);
  const normalizedKey = normalizeGuardrailKey(key);

  await storage.set(file, normalizedKey, value);

  return `${normalizedKey}=${value}`;
}

export type GuardRmOptions = {
  file: string;
};

export async function guardRm(key: string, options: GuardRmOptions): Promise<string> {
  const { file } = options;

  if (!key) {
    throw new Error("missing required argument: <key>");
  }

  const normalizedKey = normalizeGuardrailKey(key);

  await storage.remove(file, normalizedKey);

  return `Removed: ${normalizedKey}`;
}

export type GuardShowOptions = {
  file: string;
};

export async function guardShow(options: GuardShowOptions): Promise<string> {
  const { file } = options;

  const decrypted = await storage.load(file);
  const raw = JSON.stringify(decrypted);

  let env: ParsedEnv = { entries: [], guardrails: undefined };
  try {
    env = parseEnvInput(raw);
  } catch {
    // Ignore parse errors, show defaults only
  }

  return guardShowCore(env);
}

export function registerGuardCommands(program: Command): void {
  const guardCmd = program.command("guard").description("Guardrail commands");

  guardCmd
    .command("update")
    .description("Add or update a guardrail value")
    .argument("<key>", "Guardrail key")
    .argument("<value>", "Guardrail value (positive integer)")
    .action(async (key: string, value: string) => {
      const opts = program.opts<{ file: string }>();

      try {
        const result = await guardUpdate(key, value, { file: opts.file });
        console.log(result);
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });

  guardCmd
    .command("rm")
    .description("Remove a guardrail")
    .argument("<key>", "Guardrail key")
    .action(async (key: string) => {
      const opts = program.opts<{ file: string }>();

      try {
        const result = await guardRm(key, { file: opts.file });
        console.log(result);
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });

  guardCmd
    .command("show")
    .description("Show guardrail configuration")
    .action(async () => {
      const opts = program.opts<{ file: string }>();

      try {
        const result = await guardShow({ file: opts.file });
        console.log(result);
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
