import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  addEntry,
  listEntries,
  removeEntry,
  getOtp,
  type CommandContext,
} from "../src/cli/commands.js";
import type { TotpEntry, HotpEntry } from "../src/vault/format.js";

describe("CLI Commands", () => {
  let tmpDir: string;
  const passphrase = "test-passphrase";
  const vaultName = "test-vault";

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "otplib-cli-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    vi.useRealTimers();
  });

  function createCtx(): CommandContext {
    return { vaultPath: path.join(tmpDir, `${vaultName}.vault`), passphrase };
  }

  describe("addEntry", () => {
    test("adds a TOTP entry and returns id", async () => {
      const ctx = createCtx();

      const id = await addEntry(ctx, {
        label: "Test Account",
        issuer: "TestIssuer",
        type: "totp",
        secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
        digits: 6,
        algorithm: "sha1",
        period: 30,
      });

      expect(id).toMatch(/^[a-f0-9]+$/);
    });

    test("adds an HOTP entry and returns id", async () => {
      const ctx = createCtx();

      const id = await addEntry(ctx, {
        label: "HOTP Account",
        issuer: "TestIssuer",
        type: "hotp",
        secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
        digits: 6,
        algorithm: "sha1",
        counter: 0,
      });

      expect(id).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe("listEntries", () => {
    test("lists added entries", async () => {
      const ctx = createCtx();

      await addEntry(ctx, {
        label: "Account 1",
        type: "totp",
        secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
        digits: 6,
        algorithm: "sha1",
        period: 30,
      });

      await addEntry(ctx, {
        label: "Account 2",
        type: "totp",
        secret: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP",
        digits: 6,
        algorithm: "sha1",
        period: 30,
      });

      const list = await listEntries(ctx);

      expect(list).toHaveLength(2);
      expect(list.map((e) => e.label)).toContain("Account 1");
      expect(list.map((e) => e.label)).toContain("Account 2");
      expect(list[0]).not.toHaveProperty("secret");
    });

    test("returns empty array for new vault", async () => {
      const ctx = createCtx();

      const list = await listEntries(ctx);

      expect(list).toEqual([]);
    });
  });

  describe("removeEntry", () => {
    test("removes an entry by id", async () => {
      const ctx = createCtx();

      const id = await addEntry(ctx, {
        label: "To Remove",
        type: "totp",
        secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
        digits: 6,
        algorithm: "sha1",
        period: 30,
      });

      await removeEntry(ctx, id);

      const list = await listEntries(ctx);
      expect(list).toHaveLength(0);
    });

    test("throws for non-existent entry", async () => {
      const ctx = createCtx();

      await expect(removeEntry(ctx, "non-existent")).rejects.toThrow();
    });
  });

  describe("getOtp", () => {
    test("generates OTP for existing entry", async () => {
      vi.setSystemTime(1704067200000);
      const ctx = createCtx();

      const id = await addEntry(ctx, {
        label: "OTP Test",
        type: "totp",
        secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
        digits: 6,
        algorithm: "sha1",
        period: 30,
      });

      const code = await getOtp(ctx, id);

      expect(code).toMatch(/^\d{6}$/);
    });

    test("throws for non-existent entry", async () => {
      const ctx = createCtx();

      await expect(getOtp(ctx, "non-existent")).rejects.toThrow();
    });
  });

  describe("add/list/remove/otp lifecycle", () => {
    test("full lifecycle works", async () => {
      vi.setSystemTime(1704067200000);
      const ctx = createCtx();

      const id = await addEntry(ctx, {
        label: "Lifecycle Test",
        issuer: "Test",
        type: "totp",
        secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
        digits: 6,
        algorithm: "sha1",
        period: 30,
      });

      const list = await listEntries(ctx);
      expect(list.some((e) => e.id === id)).toBe(true);

      const code = await getOtp(ctx, id);
      expect(code).toMatch(/^\d{6}$/);

      await removeEntry(ctx, id);
      const listAfter = await listEntries(ctx);
      expect(listAfter.some((e) => e.id === id)).toBe(false);
    });
  });
});
