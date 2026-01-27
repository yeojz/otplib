import crypto from "node:crypto";

import { generateOtp } from "../otp/generate.js";
import {
  getVaultEntry,
  listVaultIndex,
  loadVault,
  saveVault,
  vaultExists,
} from "../vault/store.js";

import type {
  HotpEntry,
  IndexEntry,
  OtpAlgorithm,
  OtpDigits,
  TotpEntry,
  VaultEntry,
} from "../vault/format.js";

export type CommandContext = {
  vaultPath: string;
  passphrase: string;
};

export type AddTotpInput = {
  label: string;
  issuer?: string;
  type: "totp";
  secret: string;
  digits: OtpDigits;
  algorithm: OtpAlgorithm;
  period: number;
};

export type AddHotpInput = {
  label: string;
  issuer?: string;
  type: "hotp";
  secret: string;
  digits: OtpDigits;
  algorithm: OtpAlgorithm;
  counter: number;
};

export type AddEntryInput = AddTotpInput | AddHotpInput;

function generateId(): string {
  return crypto.randomBytes(8).toString("hex");
}

export async function addEntry(ctx: CommandContext, input: AddEntryInput): Promise<string> {
  const id = generateId();
  const { vaultPath, passphrase } = ctx;

  let entry: VaultEntry;
  if (input.type === "totp") {
    entry = {
      id,
      label: input.label,
      issuer: input.issuer,
      type: "totp",
      secret: input.secret,
      digits: input.digits,
      algorithm: input.algorithm,
      period: input.period,
    } satisfies TotpEntry;
  } else {
    entry = {
      id,
      label: input.label,
      issuer: input.issuer,
      type: "hotp",
      secret: input.secret,
      digits: input.digits,
      algorithm: input.algorithm,
      counter: input.counter,
    } satisfies HotpEntry;
  }

  const exists = await vaultExists(vaultPath);
  if (exists) {
    const data = await loadVault(vaultPath, passphrase);
    data.entries.push(entry);
    await saveVault(vaultPath, passphrase, data);
  } else {
    await saveVault(vaultPath, passphrase, { entries: [entry] });
  }

  return id;
}

export async function listEntries(ctx: CommandContext): Promise<IndexEntry[]> {
  const { vaultPath, passphrase } = ctx;

  const exists = await vaultExists(vaultPath);
  if (!exists) {
    return [];
  }

  return listVaultIndex(vaultPath, passphrase);
}

export async function removeEntry(ctx: CommandContext, entryId: string): Promise<void> {
  const { vaultPath, passphrase } = ctx;

  const exists = await vaultExists(vaultPath);
  if (!exists) {
    throw new Error(`Entry not found: ${entryId}`);
  }

  const data = await loadVault(vaultPath, passphrase);
  const index = data.entries.findIndex((e) => e.id === entryId);

  if (index === -1) {
    throw new Error(`Entry not found: ${entryId}`);
  }

  data.entries.splice(index, 1);
  await saveVault(vaultPath, passphrase, data);
}

export async function getOtp(ctx: CommandContext, entryId: string): Promise<string> {
  const { vaultPath, passphrase } = ctx;

  const entry = await getVaultEntry(vaultPath, passphrase, entryId);
  return generateOtp(entry);
}
