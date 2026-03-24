import { describe, it, expect } from "vitest";
import { fromCXF } from "./from-cxf.js";
import type { CXFDocument } from "./types.js";

const validDoc: CXFDocument = {
  version: { major: 1, minor: 0 },
  exporter: { name: "test" },
  accounts: [
    {
      id: "acc-1",
      items: [
        {
          id: "item-1",
          type: "totp",
          creation_date: 1700000000,
          credentials: {
            totp: {
              secret: "JBSWY3DPEHPK3PXP",
              period: 30,
              digits: 6,
              algorithm: "SHA1",
              username: "user@example.com",
              issuer: "GitHub",
            },
          },
        },
        {
          id: "item-2",
          type: "totp",
          creation_date: 1700000000,
          credentials: {
            totp: {
              secret: "NBSWY3DPEHPK3PXQ",
              period: 60,
              digits: 8,
              algorithm: "SHA256",
              username: "admin@example.com",
            },
          },
        },
      ],
    },
  ],
};

describe("fromCXF", () => {
  it("should parse a valid CXF document with multiple TOTP entries", () => {
    const accounts = fromCXF(validDoc);

    expect(accounts).toHaveLength(2);
    expect(accounts[0]).toEqual({
      type: "totp",
      secret: "JBSWY3DPEHPK3PXP",
      name: "user@example.com",
      issuer: "GitHub",
      algorithm: "sha1",
      digits: 6,
      period: 30,
    });
    expect(accounts[1]).toEqual({
      type: "totp",
      secret: "NBSWY3DPEHPK3PXQ",
      name: "admin@example.com",
      algorithm: "sha256",
      digits: 8,
      period: 60,
    });
  });

  it("should parse a JSON string input", () => {
    const accounts = fromCXF(JSON.stringify(validDoc));
    expect(accounts).toHaveLength(2);
    expect(accounts[0]!.secret).toBe("JBSWY3DPEHPK3PXP");
  });

  it("should skip non-OTP credential types", () => {
    const doc: CXFDocument = {
      version: { major: 1, minor: 0 },
      accounts: [
        {
          id: "acc-1",
          items: [
            {
              id: "item-1",
              type: "password",
              credentials: { password: { value: "secret123" } },
            },
            {
              id: "item-2",
              type: "passkey",
              credentials: { passkey: { credentialId: "abc" } },
            },
            {
              id: "item-3",
              type: "totp",
              credentials: {
                totp: {
                  secret: "JBSWY3DPEHPK3PXP",
                },
              },
            },
          ],
        },
      ],
    };

    const accounts = fromCXF(doc);
    expect(accounts).toHaveLength(1);
    expect(accounts[0]!.type).toBe("totp");
  });

  it("should apply defaults for missing optional fields", () => {
    const doc: CXFDocument = {
      version: { major: 1, minor: 0 },
      accounts: [
        {
          id: "acc-1",
          items: [
            {
              id: "item-1",
              type: "totp",
              credentials: {
                totp: {
                  secret: "JBSWY3DPEHPK3PXP",
                },
              },
            },
          ],
        },
      ],
    };

    const accounts = fromCXF(doc);
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toEqual({
      type: "totp",
      secret: "JBSWY3DPEHPK3PXP",
      algorithm: "sha1",
      digits: 6,
      period: 30,
    });
  });

  it("should throw on invalid JSON string", () => {
    expect(() => fromCXF("not json")).toThrow("not valid JSON");
  });

  it("should throw on missing version", () => {
    const doc = { accounts: [] } as unknown as CXFDocument;
    expect(() => fromCXF(doc)).toThrow("missing required");
  });

  it("should throw on missing accounts", () => {
    const doc = { version: { major: 1, minor: 0 } } as unknown as CXFDocument;
    expect(() => fromCXF(doc)).toThrow("missing required");
  });

  it("should throw on null input parsed from string", () => {
    expect(() => fromCXF("null")).toThrow("missing required");
  });

  it("should handle empty accounts array", () => {
    const doc: CXFDocument = {
      version: { major: 1, minor: 0 },
      accounts: [],
    };

    const accounts = fromCXF(doc);
    expect(accounts).toEqual([]);
  });

  it("should handle accounts with no TOTP items", () => {
    const doc: CXFDocument = {
      version: { major: 1, minor: 0 },
      accounts: [
        {
          id: "acc-1",
          items: [
            {
              id: "item-1",
              type: "password",
              credentials: { password: { value: "x" } },
            },
          ],
        },
      ],
    };

    const accounts = fromCXF(doc);
    expect(accounts).toEqual([]);
  });

  it("should handle algorithm case mapping", () => {
    const doc: CXFDocument = {
      version: { major: 1, minor: 0 },
      accounts: [
        {
          id: "acc-1",
          items: [
            {
              id: "item-1",
              type: "totp",
              credentials: {
                totp: { secret: "ABC", algorithm: "SHA256" },
              },
            },
            {
              id: "item-2",
              type: "totp",
              credentials: {
                totp: { secret: "DEF", algorithm: "SHA512" },
              },
            },
            {
              id: "item-3",
              type: "totp",
              credentials: {
                totp: { secret: "GHI", algorithm: "sha1" },
              },
            },
          ],
        },
      ],
    };

    const accounts = fromCXF(doc);
    expect(accounts[0]!.algorithm).toBe("sha256");
    expect(accounts[1]!.algorithm).toBe("sha512");
    expect(accounts[2]!.algorithm).toBe("sha1");
  });

  it("should skip items with missing credentials secret", () => {
    const doc: CXFDocument = {
      version: { major: 1, minor: 0 },
      accounts: [
        {
          id: "acc-1",
          items: [
            {
              id: "item-1",
              type: "totp",
              credentials: {
                totp: {} as { secret: string },
              },
            },
          ],
        },
      ],
    };

    const accounts = fromCXF(doc);
    expect(accounts).toEqual([]);
  });

  it("should skip items without type string", () => {
    const doc: CXFDocument = {
      version: { major: 1, minor: 0 },
      accounts: [
        {
          id: "acc-1",
          items: [{ id: "bad", type: 123 as unknown as string, credentials: {} }],
        },
      ],
    };

    const accounts = fromCXF(doc);
    expect(accounts).toEqual([]);
  });

  it("should skip accounts with non-array items", () => {
    const doc = {
      version: { major: 1, minor: 0 },
      accounts: [{ id: "acc-1", items: "not-array" }],
    } as unknown as CXFDocument;

    const accounts = fromCXF(doc);
    expect(accounts).toEqual([]);
  });
});
