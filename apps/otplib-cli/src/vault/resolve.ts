import path from "node:path";

export type ResolveVaultNameOptions = {
  vaultFlag?: string;
  envVault?: string;
};

export function resolveVaultName(options: ResolveVaultNameOptions): string {
  return options.vaultFlag ?? options.envVault ?? "default";
}

export function resolveVaultPath(vaultName: string | undefined, configRoot: string): string {
  const name = vaultName ?? "default";
  return path.join(configRoot, "vaults", `${name}.vault`);
}
