import { describe, it, expect } from "vitest";
import { parseURI, generateURIFromAccount } from "./account.js";
import { BASE_SECRET_BASE32 } from "@repo/testing";
import type { OTPAccount } from "@otplib/core";

describe("parseURI", () => {
  it("should parse a basic TOTP URI", () => {
    const uri = `otpauth://totp/GitHub:user%40example.com?secret=${BASE_SECRET_BASE32}&issuer=GitHub`;
    const account = parseURI(uri);

    expect(account).toEqual({
      type: "totp",
      secret: BASE_SECRET_BASE32,
      name: "user@example.com",
      issuer: "GitHub",
    });
  });

  it("should parse a TOTP URI with all parameters", () => {
    const uri = `otpauth://totp/GitHub:user%40example.com?secret=${BASE_SECRET_BASE32}&issuer=GitHub&algorithm=SHA256&digits=8&period=60`;
    const account = parseURI(uri);

    expect(account).toEqual({
      type: "totp",
      secret: BASE_SECRET_BASE32,
      name: "user@example.com",
      issuer: "GitHub",
      algorithm: "sha256",
      digits: 8,
      period: 60,
    });
  });

  it("should parse an HOTP URI", () => {
    const uri = `otpauth://hotp/Service:admin?secret=${BASE_SECRET_BASE32}&issuer=Service&counter=42`;
    const account = parseURI(uri);

    expect(account).toEqual({
      type: "hotp",
      secret: BASE_SECRET_BASE32,
      name: "admin",
      issuer: "Service",
      counter: 42,
    });
  });

  it("should extract issuer from label when not in params", () => {
    const uri = `otpauth://totp/ACME:user?secret=${BASE_SECRET_BASE32}`;
    const account = parseURI(uri);

    expect(account.issuer).toBe("ACME");
    expect(account.name).toBe("user");
  });

  it("should prefer param issuer over label issuer", () => {
    const uri = `otpauth://totp/LabelIssuer:user?secret=${BASE_SECRET_BASE32}&issuer=ParamIssuer`;
    const account = parseURI(uri);

    expect(account.issuer).toBe("ParamIssuer");
  });

  it("should handle URI without issuer prefix in label", () => {
    const uri = `otpauth://totp/user%40example.com?secret=${BASE_SECRET_BASE32}`;
    const account = parseURI(uri);

    expect(account.name).toBe("user@example.com");
    expect(account).not.toHaveProperty("issuer");
  });

  it("should not include optional fields when absent", () => {
    const uri = `otpauth://totp/user?secret=${BASE_SECRET_BASE32}`;
    const account = parseURI(uri);

    expect(account).not.toHaveProperty("algorithm");
    expect(account).not.toHaveProperty("digits");
    expect(account).not.toHaveProperty("period");
    expect(account).not.toHaveProperty("counter");
  });

  it("should handle URL-encoded characters in name", () => {
    const uri = `otpauth://totp/Service:user%2Btag%40example.com?secret=${BASE_SECRET_BASE32}&issuer=Service`;
    const account = parseURI(uri);

    expect(account.name).toBe("user+tag@example.com");
  });

  it("should handle empty label", () => {
    const uri = `otpauth://totp/?secret=${BASE_SECRET_BASE32}`;
    const account = parseURI(uri);

    expect(account).not.toHaveProperty("name");
  });
});

describe("generateURIFromAccount", () => {
  it("should generate a TOTP URI from an account", () => {
    const account: OTPAccount = {
      type: "totp",
      secret: BASE_SECRET_BASE32,
      name: "user@example.com",
      issuer: "GitHub",
    };

    const uri = generateURIFromAccount(account);

    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain(`secret=${BASE_SECRET_BASE32}`);
    expect(uri).toContain("issuer=GitHub");
    expect(uri).toContain("user%40example.com");
  });

  it("should generate an HOTP URI from an account", () => {
    const account: OTPAccount = {
      type: "hotp",
      secret: BASE_SECRET_BASE32,
      name: "admin",
      issuer: "ACME",
      counter: 10,
    };

    const uri = generateURIFromAccount(account);

    expect(uri).toContain("otpauth://hotp/");
    expect(uri).toContain("counter=10");
    expect(uri).toContain("issuer=ACME");
  });

  it("should include non-default parameters", () => {
    const account: OTPAccount = {
      type: "totp",
      secret: BASE_SECRET_BASE32,
      name: "user",
      issuer: "Svc",
      algorithm: "sha512",
      digits: 8,
      period: 60,
    };

    const uri = generateURIFromAccount(account);

    expect(uri).toContain("algorithm=SHA512");
    expect(uri).toContain("digits=8");
    expect(uri).toContain("period=60");
  });

  it("should handle account without issuer", () => {
    const account: OTPAccount = {
      type: "totp",
      secret: BASE_SECRET_BASE32,
      name: "user",
    };

    const uri = generateURIFromAccount(account);

    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain(`secret=${BASE_SECRET_BASE32}`);
  });

  it("should handle account without name", () => {
    const account: OTPAccount = {
      type: "totp",
      secret: BASE_SECRET_BASE32,
      issuer: "Service",
    };

    const uri = generateURIFromAccount(account);

    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain(`secret=${BASE_SECRET_BASE32}`);
  });
});

describe("round-trip: parseURI(generateURIFromAccount(account))", () => {
  it("should round-trip a TOTP account with all fields", () => {
    const account: OTPAccount = {
      type: "totp",
      secret: BASE_SECRET_BASE32,
      name: "user@example.com",
      issuer: "GitHub",
      algorithm: "sha256",
      digits: 8,
      period: 60,
    };

    const result = parseURI(generateURIFromAccount(account));

    expect(result.type).toBe(account.type);
    expect(result.secret).toBe(account.secret);
    expect(result.name).toBe(account.name);
    expect(result.issuer).toBe(account.issuer);
    expect(result.algorithm).toBe(account.algorithm);
    expect(result.digits).toBe(account.digits);
    expect(result.period).toBe(account.period);
  });

  it("should round-trip an HOTP account", () => {
    const account: OTPAccount = {
      type: "hotp",
      secret: BASE_SECRET_BASE32,
      name: "admin",
      issuer: "ACME",
      algorithm: "sha512",
      digits: 8,
      counter: 42,
    };

    const result = parseURI(generateURIFromAccount(account));

    expect(result.type).toBe(account.type);
    expect(result.secret).toBe(account.secret);
    expect(result.name).toBe(account.name);
    expect(result.issuer).toBe(account.issuer);
    expect(result.algorithm).toBe(account.algorithm);
    expect(result.digits).toBe(account.digits);
    expect(result.counter).toBe(account.counter);
  });

  it("should round-trip a minimal TOTP account", () => {
    const account: OTPAccount = {
      type: "totp",
      secret: BASE_SECRET_BASE32,
      name: "user",
      issuer: "Svc",
    };

    const result = parseURI(generateURIFromAccount(account));

    expect(result.type).toBe("totp");
    expect(result.secret).toBe(BASE_SECRET_BASE32);
    expect(result.name).toBe("user");
    expect(result.issuer).toBe("Svc");
  });
});
