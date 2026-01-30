import { Command } from "commander";

import { readStdin } from "../shared/stdin.js";
import { VERSION } from "../shared/version.js";
import { registerAddCommand } from "./commands/add.js";
import { registerGuardCommands } from "./commands/guard.js";
import { registerInitCommand } from "./commands/init.js";
import { registerListCommand } from "./commands/list.js";
import { registerTokenCommand } from "./commands/token.js";
import { registerVerifyCommand } from "./commands/verify.js";

import type { ReadStdinFn } from "../shared/stdin.js";

export type { ReadStdinFn } from "../shared/stdin.js";
export { readStdin } from "../shared/stdin.js";

const DEFAULT_FILE = ".env.otplibx";

export function createOtplibxCli(readStdinFn: ReadStdinFn = readStdin): Command {
  const program = new Command();

  program
    .name("otplibx")
    .description("otplib with dotenvx as storage backend")
    .version(VERSION)
    .option("-f, --file <path>", "dotenvx secrets file", process.env.OTPLIBX_FILE ?? DEFAULT_FILE);

  registerInitCommand(program);
  registerAddCommand(program, readStdinFn);
  registerTokenCommand(program, readStdinFn);
  registerVerifyCommand(program);
  registerListCommand(program);
  registerGuardCommands(program);

  return program;
}

createOtplibxCli()
  .parseAsync(process.argv)
  .catch((err) => {
    console.error(`error: ${err.message}`);
    process.exitCode = 1;
  });
