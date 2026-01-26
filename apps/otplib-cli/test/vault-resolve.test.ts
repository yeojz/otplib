import { describe, expect, test } from "vitest";
import { resolveVaultName, resolveVaultPath } from "../src/vault/resolve.js";

describe("resolveVaultName", () => {
  test("uses --vault over env", () => {
    expect(resolveVaultName({ vaultFlag: "team", envVault: "default" })).toBe("team");
  });

  test("uses env when no flag", () => {
    expect(resolveVaultName({ envVault: "personal" })).toBe("personal");
  });

  test("defaults to 'default' when neither provided", () => {
    expect(resolveVaultName({})).toBe("default");
  });
});

describe("resolveVaultPath", () => {
  test("returns path with vault name and .vault extension", () => {
    const path = resolveVaultPath("test", "/config/root");
    expect(path).toBe("/config/root/vaults/test.vault");
  });

  test("uses default vault name if not provided", () => {
    const path = resolveVaultPath(undefined, "/config/root");
    expect(path).toBe("/config/root/vaults/default.vault");
  });
});
