import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  createVault,
  getVaultEntry,
  listVaultIndex,
  loadVault,
  saveVault,
  updateVaultPassphrase,
  vaultExists,
} from "../src/vault/store.js";
import type { VaultEntry } from "../src/vault/format.js";

describe("VaultStore", () => {
  let tmpDir: string;
  let vaultPath: string;
  const passphrase = "test-passphrase";

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "otplib-cli-test-"));
    vaultPath = path.join(tmpDir, "test.vault");
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  const entry1: VaultEntry = {
    id: "entry-1",
    label: "Test Account 1",
    issuer: "TestIssuer",
    type: "totp",
    secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
    digits: 6,
    algorithm: "sha1",
    period: 30,
  };

  const entry2: VaultEntry = {
    id: "entry-2",
    label: "Test Account 2",
    issuer: "AnotherIssuer",
    type: "hotp",
    secret: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP",
    digits: 8,
    algorithm: "sha256",
    counter: 0,
  };

  test("saveVault/loadVault preserves entries", async () => {
    await saveVault(vaultPath, passphrase, { entries: [entry1, entry2] });
    const loaded = await loadVault(vaultPath, passphrase);

    expect(loaded.entries.map((e) => e.id)).toEqual([entry1.id, entry2.id]);
    expect(loaded.entries[0]).toEqual(entry1);
    expect(loaded.entries[1]).toEqual(entry2);
  });

  test("loadVault throws on wrong passphrase", async () => {
    await saveVault(vaultPath, passphrase, { entries: [entry1] });

    await expect(loadVault(vaultPath, "wrong-passphrase")).rejects.toThrow();
  });

  test("loadVault throws on non-existent vault", async () => {
    const nonExistentPath = path.join(tmpDir, "non-existent.vault");

    await expect(loadVault(nonExistentPath, passphrase)).rejects.toThrow();
  });

  test("vaultExists returns false for non-existent vault", async () => {
    expect(await vaultExists(vaultPath)).toBe(false);
  });

  test("vaultExists returns true after save", async () => {
    await saveVault(vaultPath, passphrase, { entries: [] });

    expect(await vaultExists(vaultPath)).toBe(true);
  });

  test("listVaultIndex returns entry metadata without secrets", async () => {
    await saveVault(vaultPath, passphrase, { entries: [entry1, entry2] });
    const index = await listVaultIndex(vaultPath, passphrase);

    expect(index).toHaveLength(2);
    expect(index[0]).toEqual({
      id: entry1.id,
      label: entry1.label,
      issuer: entry1.issuer,
      type: entry1.type,
      digits: entry1.digits,
      algorithm: entry1.algorithm,
      period: entry1.period,
    });
    expect(index[0]).not.toHaveProperty("secret");
  });

  test("getVaultEntry returns single decrypted entry", async () => {
    await saveVault(vaultPath, passphrase, { entries: [entry1, entry2] });
    const entry = await getVaultEntry(vaultPath, passphrase, entry1.id);

    expect(entry).toEqual(entry1);
  });

  test("getVaultEntry throws for non-existent entry", async () => {
    await saveVault(vaultPath, passphrase, { entries: [entry1] });

    await expect(getVaultEntry(vaultPath, passphrase, "non-existent")).rejects.toThrow();
  });

  test("createVault creates vault with no entries", async () => {
    await createVault(vaultPath, passphrase);

    expect(await vaultExists(vaultPath)).toBe(true);
    const loaded = await loadVault(vaultPath, passphrase);
    expect(loaded.entries).toEqual([]);
  });

  test("createVault throws if vault already exists", async () => {
    await createVault(vaultPath, passphrase);

    await expect(createVault(vaultPath, passphrase)).rejects.toThrow("Vault already exists");
  });

  test("createVault creates parent directories", async () => {
    const nestedPath = path.join(tmpDir, "nested", "dir", "test.vault");

    await createVault(nestedPath, passphrase);

    expect(await vaultExists(nestedPath)).toBe(true);
  });

  test("updateVaultPassphrase changes passphrase", async () => {
    const newPassphrase = "new-test-passphrase";
    await saveVault(vaultPath, passphrase, { entries: [entry1, entry2] });

    await updateVaultPassphrase(vaultPath, passphrase, newPassphrase);

    // Old passphrase should fail
    await expect(loadVault(vaultPath, passphrase)).rejects.toThrow();

    // New passphrase should work and data should be intact
    const loaded = await loadVault(vaultPath, newPassphrase);
    expect(loaded.entries).toHaveLength(2);
    expect(loaded.entries[0]).toEqual(entry1);
    expect(loaded.entries[1]).toEqual(entry2);
  });

  test("updateVaultPassphrase throws on wrong current passphrase", async () => {
    await saveVault(vaultPath, passphrase, { entries: [entry1] });

    await expect(
      updateVaultPassphrase(vaultPath, "wrong-passphrase", "new-passphrase"),
    ).rejects.toThrow();
  });
});
