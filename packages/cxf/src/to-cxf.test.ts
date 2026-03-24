import { describe, it, expect, vi, afterEach } from "vitest";
import { toCXF } from "./to-cxf.js";
import type { OTPAccount } from "@otplib/core";

describe("toCXF", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should produce a valid CXF document structure", () => {
    const accounts: OTPAccount[] = [
      {
        type: "totp",
        secret: "JBSWY3DPEHPK3PXP",
        name: "user@example.com",
        issuer: "GitHub",
        algorithm: "sha256",
        digits: 8,
        period: 60,
      },
    ];

    const doc = toCXF(accounts);

    expect(doc.version).toEqual({ major: 1, minor: 0 });
    expect(doc.exporter).toEqual({ name: "otplib" });
    expect(typeof doc.export_date).toBe("number");
    expect(doc.accounts).toHaveLength(1);
    expect(doc.accounts[0]!.items).toHaveLength(1);

    const item = doc.accounts[0]!.items[0]!;
    expect(item.type).toBe("totp");
    expect(item.credentials.totp).toEqual({
      secret: "JBSWY3DPEHPK3PXP",
      period: 60,
      digits: 8,
      algorithm: "SHA256",
      username: "user@example.com",
      issuer: "GitHub",
    });
  });

  it("should handle multiple accounts", () => {
    const accounts: OTPAccount[] = [
      { type: "totp", secret: "AAA" },
      { type: "totp", secret: "BBB" },
      { type: "totp", secret: "CCC" },
    ];

    const doc = toCXF(accounts);

    expect(doc.accounts).toHaveLength(1);
    expect(doc.accounts[0]!.items).toHaveLength(3);
  });

  it("should handle empty accounts array", () => {
    const doc = toCXF([]);

    expect(doc.accounts).toHaveLength(1);
    expect(doc.accounts[0]!.items).toHaveLength(0);
  });

  it("should use custom exporter name", () => {
    const doc = toCXF([], { exporterName: "my-app" });

    expect(doc.exporter).toEqual({ name: "my-app" });
  });

  it("should apply defaults for missing fields", () => {
    const doc = toCXF([{ type: "totp", secret: "JBSWY3DPEHPK3PXP" }]);

    const cred = doc.accounts[0]!.items[0]!.credentials.totp;
    expect(cred!.period).toBe(30);
    expect(cred!.digits).toBe(6);
    expect(cred!.algorithm).toBe("SHA1");
  });

  it("should map algorithm to uppercase", () => {
    const doc = toCXF([{ type: "totp", secret: "A", algorithm: "sha512" }]);

    expect(doc.accounts[0]!.items[0]!.credentials.totp!.algorithm).toBe("SHA512");
  });

  it("should not include username when name is undefined", () => {
    const doc = toCXF([{ type: "totp", secret: "A" }]);

    expect(doc.accounts[0]!.items[0]!.credentials.totp).not.toHaveProperty("username");
  });

  it("should not include issuer when not provided", () => {
    const doc = toCXF([{ type: "totp", secret: "A" }]);

    expect(doc.accounts[0]!.items[0]!.credentials.totp).not.toHaveProperty("issuer");
  });

  it("should generate unique IDs for accounts and items", () => {
    const doc = toCXF([
      { type: "totp", secret: "A" },
      { type: "totp", secret: "B" },
    ]);

    const accountId = doc.accounts[0]!.id;
    const itemId1 = doc.accounts[0]!.items[0]!.id;
    const itemId2 = doc.accounts[0]!.items[1]!.id;

    expect(typeof accountId).toBe("string");
    expect(accountId.length).toBeGreaterThan(0);
    expect(itemId1).not.toBe(itemId2);
  });

  it("should set creation_date on items", () => {
    const doc = toCXF([{ type: "totp", secret: "A" }]);
    const item = doc.accounts[0]!.items[0]!;

    expect(typeof item.creation_date).toBe("number");
    expect(item.creation_date!).toBeGreaterThan(0);
  });

  it("should handle HOTP accounts", () => {
    const doc = toCXF([{ type: "hotp", secret: "A", counter: 5 }]);
    const item = doc.accounts[0]!.items[0]!;

    expect(item.type).toBe("hotp");
    // HOTP credentials are stored under the "hotp" key
    expect(item.credentials["hotp"]).toBeDefined();
  });
});
