import { execSync, spawnSync } from "node:child_process";

export type ExecResult = {
  stdout: string;
  stderr: string;
  status: number;
};

export type ExecOptions = {
  stdin?: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

function exec(command: string, args: string[], options?: ExecOptions): ExecResult {
  const result = spawnSync(command, args, {
    input: options?.stdin,
    encoding: "utf-8",
    cwd: options?.cwd,
    env: { ...process.env, ...options?.env },
    maxBuffer: 10 * 1024 * 1024, // 10MB
  });

  return {
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
    status: result.status ?? 1,
  };
}

export function runDotenvx(args: string[], options?: ExecOptions): ExecResult {
  return exec("dotenvx", args, options);
}

export function runOtplib(args: string[], options?: ExecOptions): ExecResult {
  return exec("otplib", args, options);
}

export function checkCommand(command: string): boolean {
  try {
    execSync(`command -v ${command}`, { encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function requireCommand(command: string): void {
  if (!checkCommand(command)) {
    throw new Error(`${command} is required but not installed`);
  }
}
