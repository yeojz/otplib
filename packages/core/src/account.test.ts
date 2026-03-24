import { describe, it, expect } from "vitest";
import { accountToOptions } from "./account.js";
import type { OTPAccount } from "./account.js";

describe("accountToOptions", () => {
  it("should convert a TOTP account with defaults", () => {
    const account: OTPAccount = {
      type: "totp",
      secret: "JBSWY3DPEHPK3PXP",
    };

    const options = accountToOptions(account);

    expect(options).toEqual({
      secret: "JBSWY3DPEHPK3PXP",
      algorithm: "sha1",
      digits: 6,
      period: 30,
    });
  });

  it("should convert a TOTP account with all fields", () => {
    const account: OTPAccount = {
      type: "totp",
      secret: "JBSWY3DPEHPK3PXP",
      name: "user@example.com",
      issuer: "GitHub",
      algorithm: "sha256",
      digits: 8,
      period: 60,
    };

    const options = accountToOptions(account);

    expect(options).toEqual({
      secret: "JBSWY3DPEHPK3PXP",
      algorithm: "sha256",
      digits: 8,
      period: 60,
      issuer: "GitHub",
      label: "user@example.com",
    });
  });

  it("should convert an HOTP account with defaults", () => {
    const account: OTPAccount = {
      type: "hotp",
      secret: "JBSWY3DPEHPK3PXP",
    };

    const options = accountToOptions(account);

    expect(options).toEqual({
      secret: "JBSWY3DPEHPK3PXP",
      algorithm: "sha1",
      digits: 6,
      counter: 0,
    });
  });

  it("should convert an HOTP account with custom counter", () => {
    const account: OTPAccount = {
      type: "hotp",
      secret: "JBSWY3DPEHPK3PXP",
      name: "admin",
      issuer: "ACME",
      algorithm: "sha512",
      digits: 8,
      counter: 42,
    };

    const options = accountToOptions(account);

    expect(options).toEqual({
      secret: "JBSWY3DPEHPK3PXP",
      algorithm: "sha512",
      digits: 8,
      counter: 42,
      issuer: "ACME",
      label: "admin",
    });
  });

  it("should not include issuer or label when not provided", () => {
    const account: OTPAccount = {
      type: "totp",
      secret: "JBSWY3DPEHPK3PXP",
    };

    const options = accountToOptions(account);

    expect(options).not.toHaveProperty("issuer");
    expect(options).not.toHaveProperty("label");
  });

  it("should include period for TOTP but not counter", () => {
    const options = accountToOptions({
      type: "totp",
      secret: "JBSWY3DPEHPK3PXP",
      period: 60,
    });

    expect(options.period).toBe(60);
    expect(options).not.toHaveProperty("counter");
  });

  it("should include counter for HOTP but not period", () => {
    const options = accountToOptions({
      type: "hotp",
      secret: "JBSWY3DPEHPK3PXP",
      counter: 10,
    });

    expect(options.counter).toBe(10);
    expect(options).not.toHaveProperty("period");
  });
});
