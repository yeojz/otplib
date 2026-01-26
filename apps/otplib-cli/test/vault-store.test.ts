import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createVaultStore } from "../src/vault/store.js";
import type { VaultEntry } from "../src/vault/format.js";

describe("VaultStore", () => {
  let tmpDir: string;
  const passphrase = "test-passphrase";
  const vaultName = "test-vault";

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "otplib-cli-test-"));
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

  test("save/load preserves entries", async () => {
    const store = createVaultStore(tmpDir);

    await store.save(vaultName, passphrase, { entries: [entry1, entry2] });
    const loaded = await store.load(vaultName, passphrase);

    expect(loaded.entries.map((e) => e.id)).toEqual([entry1.id, entry2.id]);
    expect(loaded.entries[0]).toEqual(entry1);
    expect(loaded.entries[1]).toEqual(entry2);
  });

  test("load throws on wrong passphrase", async () => {
    const store = createVaultStore(tmpDir);

    await store.save(vaultName, passphrase, { entries: [entry1] });

    await expect(store.load(vaultName, "wrong-passphrase")).rejects.toThrow();
  });

  test("load throws on non-existent vault", async () => {
    const store = createVaultStore(tmpDir);

    await expect(store.load("non-existent", passphrase)).rejects.toThrow();
  });

  test("exists returns false for non-existent vault", async () => {
    const store = createVaultStore(tmpDir);

    expect(await store.exists(vaultName)).toBe(false);
  });

  test("exists returns true after save", async () => {
    const store = createVaultStore(tmpDir);

    await store.save(vaultName, passphrase, { entries: [] });

    expect(await store.exists(vaultName)).toBe(true);
  });

  test("listIndex returns entry metadata without secrets", async () => {
    const store = createVaultStore(tmpDir);

    await store.save(vaultName, passphrase, { entries: [entry1, entry2] });
    const index = await store.listIndex(vaultName, passphrase);

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

  test("getEntry returns single decrypted entry", async () => {
    const store = createVaultStore(tmpDir);

    await store.save(vaultName, passphrase, { entries: [entry1, entry2] });
    const entry = await store.getEntry(vaultName, passphrase, entry1.id);

    expect(entry).toEqual(entry1);
  });

  test("getEntry throws for non-existent entry", async () => {
    const store = createVaultStore(tmpDir);

    await store.save(vaultName, passphrase, { entries: [entry1] });

    await expect(store.getEntry(vaultName, passphrase, "non-existent")).rejects.toThrow();
  });
});
