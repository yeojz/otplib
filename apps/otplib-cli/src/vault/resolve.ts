import os from "node:os";
import path from "node:path";

export type ResolveVaultPathOptions = {
  vaultFlag?: string;
  envVault?: string;
};

export function resolveVaultPath(options: ResolveVaultPathOptions): string {
  const rawPath = options.vaultFlag ?? options.envVault ?? "./otplib.vault";
  return expandPath(rawPath);
}

function expandPath(inputPath: string): string {
  if (inputPath.startsWith("~")) {
    return path.join(os.homedir(), inputPath.slice(1));
  }
  return path.resolve(inputPath);
}
