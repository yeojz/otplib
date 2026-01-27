import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { entryToIndex } from "./format.js";
import { decryptPayload, encryptPayload } from "../crypto/aead.js";
import { deriveKek, unwrapDek, wrapDek } from "../crypto/kdf.js";

import type { EncryptedBlock, IndexEntry, VaultData, VaultEntry, VaultFile } from "./format.js";

function toEncryptedBlock(data: {
  nonce: Buffer;
  ciphertext: Buffer;
  tag: Buffer;
}): EncryptedBlock {
  return {
    nonce: data.nonce.toString("base64"),
    ciphertext: data.ciphertext.toString("base64"),
    tag: data.tag.toString("base64"),
  };
}

function fromEncryptedBlock(block: EncryptedBlock): {
  nonce: Buffer;
  ciphertext: Buffer;
  tag: Buffer;
} {
  return {
    nonce: Buffer.from(block.nonce, "base64"),
    ciphertext: Buffer.from(block.ciphertext, "base64"),
    tag: Buffer.from(block.tag, "base64"),
  };
}

async function ensureParentDir(filePath: string): Promise<void> {
  const parentDir = path.dirname(filePath);
  await fs.mkdir(parentDir, { recursive: true });
}

async function readVaultFile(vaultPath: string): Promise<VaultFile> {
  const content = await fs.readFile(vaultPath, "utf8");
  return JSON.parse(content) as VaultFile;
}

async function getDek(vaultFile: VaultFile, passphrase: string): Promise<Buffer> {
  const salt = Buffer.from(vaultFile.kdf.salt, "base64");
  const { kek } = await deriveKek(passphrase, {
    salt,
    N: vaultFile.kdf.N,
    r: vaultFile.kdf.r,
    p: vaultFile.kdf.p,
  });

  return unwrapDek(fromEncryptedBlock(vaultFile.dekWrap), kek);
}

async function writeVaultFile(vaultPath: string, vaultFile: VaultFile): Promise<void> {
  await ensureParentDir(vaultPath);

  const tmpPath = `${vaultPath}.tmp.${crypto.randomBytes(4).toString("hex")}`;
  await fs.writeFile(tmpPath, JSON.stringify(vaultFile, null, 2), "utf8");
  await fs.rename(tmpPath, vaultPath);
}

export async function vaultExists(vaultPath: string): Promise<boolean> {
  try {
    await fs.access(vaultPath);
    return true;
  } catch {
    return false;
  }
}

export async function createVault(vaultPath: string, passphrase: string): Promise<void> {
  if (await vaultExists(vaultPath)) {
    throw new Error("Vault already exists");
  }

  await saveVault(vaultPath, passphrase, { entries: [] });
}

export async function saveVault(
  vaultPath: string,
  passphrase: string,
  data: VaultData,
): Promise<void> {
  const { kek, params } = await deriveKek(passphrase);
  const dek = crypto.randomBytes(32);

  const dekWrap = wrapDek(dek, kek);

  const indexData: IndexEntry[] = data.entries.map(entryToIndex);
  const index = encryptPayload(indexData, dek);

  const entries: Record<string, EncryptedBlock> = {};
  for (const entry of data.entries) {
    entries[entry.id] = toEncryptedBlock(encryptPayload(entry, dek));
  }

  const vaultFile: VaultFile = {
    version: 1,
    kdf: {
      alg: "scrypt",
      salt: params.salt.toString("base64"),
      N: params.N,
      r: params.r,
      p: params.p,
    },
    dekWrap: toEncryptedBlock(dekWrap),
    index: toEncryptedBlock(index),
    entries,
  };

  await writeVaultFile(vaultPath, vaultFile);
}

export async function loadVault(vaultPath: string, passphrase: string): Promise<VaultData> {
  const vaultFile = await readVaultFile(vaultPath);
  const dek = await getDek(vaultFile, passphrase);

  const entries: VaultEntry[] = [];
  for (const entryId of Object.keys(vaultFile.entries)) {
    const entry = decryptPayload<VaultEntry>(fromEncryptedBlock(vaultFile.entries[entryId]), dek);
    entries.push(entry);
  }

  return { entries };
}

export async function listVaultIndex(vaultPath: string, passphrase: string): Promise<IndexEntry[]> {
  const vaultFile = await readVaultFile(vaultPath);
  const dek = await getDek(vaultFile, passphrase);

  return decryptPayload<IndexEntry[]>(fromEncryptedBlock(vaultFile.index), dek);
}

export async function getVaultEntry(
  vaultPath: string,
  passphrase: string,
  entryId: string,
): Promise<VaultEntry> {
  const vaultFile = await readVaultFile(vaultPath);

  if (!vaultFile.entries[entryId]) {
    throw new Error(`Entry not found: ${entryId}`);
  }

  const dek = await getDek(vaultFile, passphrase);
  return decryptPayload<VaultEntry>(fromEncryptedBlock(vaultFile.entries[entryId]), dek);
}

export async function updateVaultPassphrase(
  vaultPath: string,
  currentPassphrase: string,
  newPassphrase: string,
): Promise<void> {
  const vaultFile = await readVaultFile(vaultPath);

  // Unwrap DEK with current passphrase
  const dek = await getDek(vaultFile, currentPassphrase);

  // Re-wrap DEK with new passphrase (derive new KEK with new salt)
  const { kek: newKek, params: newParams } = await deriveKek(newPassphrase);
  const newDekWrap = wrapDek(dek, newKek);

  // Update vault file with new KDF params and wrapped DEK
  const updatedVaultFile: VaultFile = {
    ...vaultFile,
    kdf: {
      alg: "scrypt",
      salt: newParams.salt.toString("base64"),
      N: newParams.N,
      r: newParams.r,
      p: newParams.p,
    },
    dekWrap: toEncryptedBlock(newDekWrap),
  };

  await writeVaultFile(vaultPath, updatedVaultFile);
}
