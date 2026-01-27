import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { resolveVaultPath } from "../src/vault/resolve.js";

describe("resolveVaultPath", () => {
  test("defaults to ./otplib.vault (resolved to absolute)", () => {
    const result = resolveVaultPath({});
    expect(result).toBe(path.resolve("./otplib.vault"));
  });

  test("uses vaultFlag when provided", () => {
    const result = resolveVaultPath({ vaultFlag: "./custom.vault" });
    expect(result).toBe(path.resolve("./custom.vault"));
  });

  test("uses envVault when vaultFlag not provided", () => {
    const result = resolveVaultPath({ envVault: "./env.vault" });
    expect(result).toBe(path.resolve("./env.vault"));
  });

  test("vaultFlag takes precedence over envVault", () => {
    const result = resolveVaultPath({
      vaultFlag: "./flag.vault",
      envVault: "./env.vault",
    });
    expect(result).toBe(path.resolve("./flag.vault"));
  });

  test("expands ~ to home directory", () => {
    const result = resolveVaultPath({ vaultFlag: "~/my.vault" });
    expect(result).toBe(path.join(os.homedir(), "my.vault"));
  });

  test("resolves relative paths to absolute", () => {
    const result = resolveVaultPath({ vaultFlag: "../parent/my.vault" });
    expect(result).toBe(path.resolve("../parent/my.vault"));
  });

  test("preserves absolute paths", () => {
    const absolutePath = "/absolute/path/to/my.vault";
    const result = resolveVaultPath({ vaultFlag: absolutePath });
    expect(result).toBe(absolutePath);
  });
});
