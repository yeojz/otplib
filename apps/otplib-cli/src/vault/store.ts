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

export type VaultStore = {
  save(vaultName: string, passphrase: string, data: VaultData): Promise<void>;
  load(vaultName: string, passphrase: string): Promise<VaultData>;
  exists(vaultName: string): Promise<boolean>;
  listIndex(vaultName: string, passphrase: string): Promise<IndexEntry[]>;
  getEntry(vaultName: string, passphrase: string, entryId: string): Promise<VaultEntry>;
};

export function createVaultStore(configRoot: string): VaultStore {
  const vaultsDir = path.join(configRoot, "vaults");

  function vaultPath(name: string): string {
    return path.join(vaultsDir, `${name}.vault`);
  }

  async function ensureVaultsDir(): Promise<void> {
    await fs.mkdir(vaultsDir, { recursive: true });
  }

  async function save(vaultName: string, passphrase: string, data: VaultData): Promise<void> {
    await ensureVaultsDir();

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

    const filePath = vaultPath(vaultName);
    const tmpPath = `${filePath}.tmp.${crypto.randomBytes(4).toString("hex")}`;

    await fs.writeFile(tmpPath, JSON.stringify(vaultFile, null, 2), "utf8");
    await fs.rename(tmpPath, filePath);
  }

  async function readVaultFile(vaultName: string): Promise<VaultFile> {
    const filePath = vaultPath(vaultName);
    const content = await fs.readFile(filePath, "utf8");
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

  async function load(vaultName: string, passphrase: string): Promise<VaultData> {
    const vaultFile = await readVaultFile(vaultName);
    const dek = await getDek(vaultFile, passphrase);

    const entries: VaultEntry[] = [];
    for (const entryId of Object.keys(vaultFile.entries)) {
      const entry = decryptPayload<VaultEntry>(fromEncryptedBlock(vaultFile.entries[entryId]), dek);
      entries.push(entry);
    }

    return { entries };
  }

  async function exists(vaultName: string): Promise<boolean> {
    try {
      await fs.access(vaultPath(vaultName));
      return true;
    } catch {
      return false;
    }
  }

  async function listIndex(vaultName: string, passphrase: string): Promise<IndexEntry[]> {
    const vaultFile = await readVaultFile(vaultName);
    const dek = await getDek(vaultFile, passphrase);

    return decryptPayload<IndexEntry[]>(fromEncryptedBlock(vaultFile.index), dek);
  }

  async function getEntry(
    vaultName: string,
    passphrase: string,
    entryId: string,
  ): Promise<VaultEntry> {
    const vaultFile = await readVaultFile(vaultName);

    if (!vaultFile.entries[entryId]) {
      throw new Error(`Entry not found: ${entryId}`);
    }

    const dek = await getDek(vaultFile, passphrase);
    return decryptPayload<VaultEntry>(fromEncryptedBlock(vaultFile.entries[entryId]), dek);
  }

  return { save, load, exists, listIndex, getEntry };
}
