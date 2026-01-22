import { describe, it, expect } from "vitest";
import { CryptoPlugin, createGuardrails } from "@otplib/core";
import { HOTP, HashAlgorithms, type HOTPOptions } from "./index.js";
import { RFC4226_VECTORS, BASE_SECRET, BASE_SECRET_BASE32 } from "@repo/testing";

describe("HOTP (v11-adapter)", () => {
  it("should match RFC 4226 vectors", () => {
    const hotp = new HOTP({
      algorithm: HashAlgorithms.SHA1,
      digits: 6,
    });

    RFC4226_VECTORS.forEach(({ counter, expected }) => {
      expect(hotp.generate(BASE_SECRET, counter)).toBe(expected);
    });
  });

  it("should check token correctly", () => {
    const hotp = new HOTP();
    const token = hotp.generate(BASE_SECRET, 0);
    expect(hotp.check(token, BASE_SECRET, 0)).toBe(true);
    expect(hotp.check(token, BASE_SECRET, 1)).toBe(false);
  });

  it("should support hex encoding", () => {
    const hotp = new HOTP();
    // 32 chars = 16 bytes
    const secret = "48656c6c6f2148656c6c6f2148656c6c";

    // Set explicit encoding in options
    hotp.options = { encoding: "hex" };
    const token = hotp.generate(secret, 0);

    expect(hotp.check(token, secret, 0)).toBe(true);
  });

  it("should reject hex encoding with 0x prefix", () => {
    const hotp = new HOTP();
    const secret = "0x48656c6c6f2148656c6c6f2148656c6c";

    hotp.options = { encoding: "hex" };

    expect(() => hotp.generate(secret, 0)).toThrow();
  });

  it("should support base32 encoding", () => {
    const hotp = new HOTP();
    // > 16 bytes
    const secret = BASE_SECRET_BASE32.repeat(2);

    hotp.options = { encoding: "base32" };
    const token = hotp.generate(secret, 0);

    expect(hotp.check(token, secret, 0)).toBe(true);
  });

  it("should apply guardrails from constructor", () => {
    const strictGuardrails = createGuardrails({ MIN_SECRET_BYTES: 100 });
    const hotp = new HOTP({ guardrails: strictGuardrails });

    expect(() => hotp.generate(BASE_SECRET, 0)).toThrow();
  });

  it("should manage options", () => {
    // 1. Initialize with specific defaults (digits: 8)
    const hotp = new HOTP<HOTPOptions>({ digits: 8 });
    expect(hotp.options.digits).toBe(8); // options merges defaults
    expect(hotp.allOptions().digits).toBe(8);

    // 2. Set new options (algorithm: SHA256)
    hotp.options = { algorithm: HashAlgorithms.SHA256 };
    expect(hotp.options.algorithm).toBe(HashAlgorithms.SHA256);
    expect(hotp.allOptions().algorithm).toBe(HashAlgorithms.SHA256);
    expect(hotp.options.digits).toBe(8); // Still merges defaults

    // 3. Reset options
    hotp.resetOptions();

    // 4. Verify options are cleared but defaults persist
    // The internal _options should be empty, so algorithm should revert to default (SHA1)
    expect(hotp.options.algorithm).toBeUndefined(); // Assuming default options didn't have algorithm set
    expect(hotp.allOptions().algorithm).toBe(HashAlgorithms.SHA1); // Default is SHA1

    // Defaults (digits: 8) should still be there
    expect(hotp.allOptions().digits).toBe(8);
  });

  it("should manage default options", () => {
    const hotp = new HOTP();
    hotp.defaultOptions = { digits: 8 };
    expect(hotp.defaultOptions.digits).toBe(8);
    expect(hotp.allOptions().digits).toBe(8);
    expect(hotp.optionsAll.digits).toBe(8); // Test getter alias
  });

  it("should verify with object argument", () => {
    const hotp = new HOTP();
    const token = hotp.generate(BASE_SECRET, 0);
    expect(hotp.verify({ token, secret: BASE_SECRET, counter: 0 })).toBe(true);
  });

  it("should verify throw on invalid argument", () => {
    const hotp = new HOTP();
    // @ts-expect-error - testing runtime check
    expect(() => hotp.verify("invalid")).toThrow("Expecting argument 0");
  });

  it("should generate keyuri", () => {
    const hotp = new HOTP();
    const uri = hotp.keyuri("user", "issuer", BASE_SECRET, 5);
    expect(uri).toContain("otpauth://hotp/");
    expect(uri).toContain("counter=5");
  });

  it("should return class reference", () => {
    const hotp = new HOTP();
    expect(hotp.getClass()).toBe(HOTP);
  });

  it("should create new instance", () => {
    const hotp = new HOTP();
    const instance = hotp.create({ digits: 8 });
    expect(instance).toBeInstanceOf(HOTP);
    expect(instance.allOptions().digits).toBe(8);
  });

  it("should return false when crypto throws", () => {
    const hotp = new HOTP<HOTPOptions>({
      crypto: {
        hmac: () => {
          throw new Error("error");
        },
      } as unknown as CryptoPlugin,
    });
    expect(hotp.check("123456", BASE_SECRET, 0)).toBe(false);
  });
});
