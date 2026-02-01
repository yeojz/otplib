import { Command } from "commander";

import { readStdin } from "../shared/stdin.js";
import { VERSION } from "../shared/version.js";
import { registerEncodeCommand } from "./commands/encode.js";
import { registerGuardCommands } from "./commands/guard.js";
import { registerHotpCommands } from "./commands/hotp.js";
import { registerListCommand } from "./commands/list.js";
import { registerTokenCommand } from "./commands/token.js";
import { registerTypeCommand } from "./commands/type.js";
import { registerVerifyCommand } from "./commands/verify.js";

import type { ReadStdinFn } from "../shared/stdin.js";

export type { ReadStdinFn } from "../shared/stdin.js";
export { readStdin } from "../shared/stdin.js";

export function createCli(readStdinFn: ReadStdinFn = readStdin): Command {
  const program = new Command();

  program.name("otplib").description("Stateless One-Time Password CLI").version(VERSION);

  registerEncodeCommand(program, readStdinFn);
  registerListCommand(program, readStdinFn);
  registerTokenCommand(program, readStdinFn);
  registerTypeCommand(program, readStdinFn);
  registerVerifyCommand(program, readStdinFn);
  registerHotpCommands(program, readStdinFn);
  registerGuardCommands(program, readStdinFn);

  return program;
}
