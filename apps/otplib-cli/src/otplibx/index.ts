import { Command } from "commander";

import { readStdin } from "../shared/stdin.js";
import { VERSION } from "../shared/version.js";
import { registerAddCommand } from "./commands/add.js";
import { registerGuardCommands } from "./commands/guard.js";
import { registerHotpCommands } from "./commands/hotp.js";
import { registerInitCommand } from "./commands/init.js";
import { registerListCommand } from "./commands/list.js";
import { registerTokenCommand } from "./commands/token.js";
import { registerTypeCommand } from "./commands/type.js";
import { registerVerifyCommand } from "./commands/verify.js";

import type { ReadStdinFn } from "../shared/stdin.js";

export type { ReadStdinFn } from "../shared/stdin.js";
export { readStdin } from "../shared/stdin.js";

const DEFAULT_FILE = ".env.otplibx";

export function createOtplibxCli(readStdinFn: ReadStdinFn = readStdin): Command {
  const program = new Command();

  program
    .name("otplibx")
    .description("otplib with native AES-256-GCM encrypted storage")
    .version(VERSION)
    .option(
      "-f, --file <path>",
      "encrypted secrets file",
      process.env.OTPLIBX_FILE ?? DEFAULT_FILE,
    );

  registerInitCommand(program);
  registerAddCommand(program, readStdinFn);
  registerTokenCommand(program, readStdinFn);
  registerTypeCommand(program, readStdinFn);
  registerVerifyCommand(program);
  registerListCommand(program);
  registerGuardCommands(program);
  registerHotpCommands(program);

  return program;
}
