import { formatGuardrailsTable } from "../../shared/guardrails.js";
import { parseEnvInput } from "../../shared/parse.js";

import type { ReadStdinFn } from "../../shared/stdin.js";
import type { Command } from "commander";

export function registerGuardCommands(program: Command, readStdinFn: ReadStdinFn): void {
  const guardCmd = program.command("guard").description("Guardrail commands");

  guardCmd
    .command("show")
    .description("Show guardrail configuration")
    .action(async () => {
      const raw = await readStdinFn();

      let configured: Record<string, number> = {};
      if (raw) {
        try {
          const { guardrails } = parseEnvInput(raw);
          if (guardrails) {
            configured = guardrails as Record<string, number>;
          }
        } catch {
          // Ignore parse errors, show defaults only
        }
      }

      const output = formatGuardrailsTable(configured);
      process.stdout.write(output + "\n");
    });
}
