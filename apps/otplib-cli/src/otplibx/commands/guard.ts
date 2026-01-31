import { normalizeGuardrailKey, validateGuardrailValue } from "../../shared/guardrails.js";
import { requireCommand, runDotenvx, runOtplib } from "../utils/exec.js";

import type { Command } from "commander";

export type GuardUpdateOptions = {
  file: string;
};

export function guardUpdate(key: string, value: string, options: GuardUpdateOptions): string {
  requireCommand("dotenvx");

  const { file } = options;

  if (!key) {
    throw new Error("missing required argument: <key>");
  }
  if (!value) {
    throw new Error("missing required argument: <value>");
  }

  validateGuardrailValue(value);
  const normalizedKey = normalizeGuardrailKey(key);

  const result = runDotenvx(["set", normalizedKey, value, "-f", file]);
  if (result.status !== 0) {
    throw new Error(`dotenvx set failed: ${result.stderr}`);
  }

  return `${normalizedKey}=${value}`;
}

export type GuardRmOptions = {
  file: string;
};

export function guardRm(key: string, options: GuardRmOptions): string {
  requireCommand("dotenvx");

  const { file } = options;

  if (!key) {
    throw new Error("missing required argument: <key>");
  }

  const normalizedKey = normalizeGuardrailKey(key);

  const result = runDotenvx(["set", normalizedKey, "", "-f", file]);
  if (result.status !== 0) {
    throw new Error(`dotenvx set failed: ${result.stderr}`);
  }

  return `Removed: ${normalizedKey}`;
}

export type GuardShowOptions = {
  file: string;
};

export function guardShow(options: GuardShowOptions): string {
  requireCommand("otplib");
  requireCommand("dotenvx");

  const { file } = options;

  const dotenvxResult = runDotenvx(["get", "-f", file]);
  if (dotenvxResult.status !== 0) {
    throw new Error(`dotenvx get failed: ${dotenvxResult.stderr}`);
  }

  const otplibResult = runOtplib(["guard", "show"], { stdin: dotenvxResult.stdout });
  if (otplibResult.status !== 0) {
    throw new Error(`otplib guard show failed: ${otplibResult.stderr}`);
  }

  return otplibResult.stdout;
}

export function registerGuardCommands(program: Command): void {
  const guardCmd = program.command("guard").description("Guardrail commands");

  guardCmd
    .command("update")
    .description("Add or update a guardrail value")
    .argument("<key>", "Guardrail key")
    .argument("<value>", "Guardrail value (positive integer)")
    .action((key: string, value: string) => {
      const opts = program.opts<{ file: string }>();

      try {
        const result = guardUpdate(key, value, { file: opts.file });
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
    .action((key: string) => {
      const opts = program.opts<{ file: string }>();

      try {
        const result = guardRm(key, { file: opts.file });
        console.log(result);
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });

  guardCmd
    .command("show")
    .description("Show guardrail configuration")
    .action(() => {
      const opts = program.opts<{ file: string }>();

      try {
        const result = guardShow({ file: opts.file });
        if (result) {
          console.log(result);
        }
      } catch (err) {
        console.error(`error: ${(err as Error).message}`);
        process.exitCode = 1;
      }
    });
}
