import { formatGuardrailsTable } from "../../shared/guardrails.js";
import { parseEnvInput } from "../../shared/parse.js";

import type { ParsedEnv } from "../../shared/parse.js";
import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

export function guardShow(env: ParsedEnv): string {
  const configured = env.guardrails ? (env.guardrails as Record<string, number>) : {};
  return formatGuardrailsTable(configured);
}

export function registerGuardCommands(program: Command, readStdinFn: ReadStdinFn): void {
  const guardCmd = program.command("guard").description("Guardrail commands");

  guardCmd
    .command("show")
    .description("Show guardrail configuration")
    .action(async () => {
      const raw = await readStdinFn();

      let env: ParsedEnv = { entries: [] };
      if (raw) {
        try {
          env = parseEnvInput(raw);
        } catch {
          // Ignore parse errors, show defaults only
        }
      }

      const output = guardShow(env);
      process.stdout.write(output + "\n");
    });
}
