import crypto from "node:crypto";

import { generateOtp } from "../otp/generate.js";
import { createVaultStore, type VaultStore } from "../vault/store.js";

import type {
  HotpEntry,
  IndexEntry,
  OtpAlgorithm,
  OtpDigits,
  TotpEntry,
  VaultEntry,
} from "../vault/format.js";

export type CommandContext = {
  store: VaultStore;
  vaultName: string;
  passphrase: string;
};

export type CommandContextOptions = {
  configRoot: string;
  vaultName: string;
  passphrase: string;
};

export function createCommandContext(options: CommandContextOptions): CommandContext {
  return {
    store: createVaultStore(options.configRoot),
    vaultName: options.vaultName,
    passphrase: options.passphrase,
  };
}

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
  const { store, vaultName, passphrase } = ctx;

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

  const exists = await store.exists(vaultName);
  if (exists) {
    const data = await store.load(vaultName, passphrase);
    data.entries.push(entry);
    await store.save(vaultName, passphrase, data);
  } else {
    await store.save(vaultName, passphrase, { entries: [entry] });
  }

  return id;
}

export async function listEntries(ctx: CommandContext): Promise<IndexEntry[]> {
  const { store, vaultName, passphrase } = ctx;

  const exists = await store.exists(vaultName);
  if (!exists) {
    return [];
  }

  return store.listIndex(vaultName, passphrase);
}

export async function removeEntry(ctx: CommandContext, entryId: string): Promise<void> {
  const { store, vaultName, passphrase } = ctx;

  const exists = await store.exists(vaultName);
  if (!exists) {
    throw new Error(`Entry not found: ${entryId}`);
  }

  const data = await store.load(vaultName, passphrase);
  const index = data.entries.findIndex((e) => e.id === entryId);

  if (index === -1) {
    throw new Error(`Entry not found: ${entryId}`);
  }

  data.entries.splice(index, 1);
  await store.save(vaultName, passphrase, data);
}

export async function getOtp(ctx: CommandContext, entryId: string): Promise<string> {
  const { store, vaultName, passphrase } = ctx;

  const entry = await store.getEntry(vaultName, passphrase, entryId);
  return generateOtp(entry);
}
