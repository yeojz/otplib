/**
 * @otplib/v12-adapter
 *
 * HOTP class tests - verifying v12 API compatibility
 */

import { describe, it, expect } from "vitest";
import { HOTP, HashAlgorithms, KeyEncodings, hotpDigestToToken, type HOTPOptions } from "./index";
import { RFC4226_VECTORS, BASE_SECRET, BASE_SECRET_BASE32 } from "@repo/testing";

describe("HOTP (v12-adapter)", () => {
  describe("constructor and options", () => {
    it("should create instance with default options", () => {
      const hotp = new HOTP();
      const opts = hotp.allOptions();

      expect(opts.algorithm).toBe(HashAlgorithms.SHA1);
      expect(opts.digits).toBe(6);
      expect(opts.encoding).toBe(KeyEncodings.ASCII);
    });

    it("should accept default options in constructor", () => {
      const hotp = new HOTP({ digits: 8 });
      const opts = hotp.allOptions();

      expect(opts.digits).toBe(8);
    });

    it("should allow setting options via property", () => {
      const hotp = new HOTP();
      hotp.options = { algorithm: "sha256" };
      const opts = hotp.allOptions();

      expect(opts.algorithm).toBe("sha256");
    });

    it("should reset options", () => {
      const hotp = new HOTP();
      hotp.options = { digits: 8 };
      hotp.resetOptions();
      const opts = hotp.allOptions();

      expect(opts.digits).toBe(6);
    });

    it("should create new instance", () => {
      const hotp = new HOTP();
      const created = hotp.create({ digits: 8 });

      expect(created).toBeInstanceOf(HOTP);
      expect(created.allOptions().digits).toBe(8);
    });
  });

  describe("generate", () => {
    it("should generate 6-digit token by default", () => {
      const hotp = new HOTP();
      const secret = BASE_SECRET;
      const token = hotp.generate(secret, 0);

      expect(token).toHaveLength(6);
      expect(token).toMatch(/^\d{6}$/);
    });

    it("should generate token for specific counter", () => {
      const hotp = new HOTP();
      const secret = BASE_SECRET;
      const token0 = hotp.generate(secret, 0);
      const token1 = hotp.generate(secret, 1);

      expect(token0).not.toBe(token1);
    });

    it("should support 8-digit tokens", () => {
      const hotp = new HOTP({ digits: 8 });
      const secret = BASE_SECRET;
      const token = hotp.generate(secret, 0);

      expect(token).toHaveLength(8);
      expect(token).toMatch(/^\d{8}$/);
    });
  });

  describe("check", () => {
    it("should return true for valid token", () => {
      const hotp = new HOTP();
      const secret = BASE_SECRET;
      const token = hotp.generate(secret, 0);

      expect(hotp.check(token, secret, 0)).toBe(true);
    });

    it("should return false for invalid token", () => {
      const hotp = new HOTP();
      const secret = BASE_SECRET;

      expect(hotp.check("000000", secret, 0)).toBe(false);
    });

    it("should return false for wrong counter", () => {
      const hotp = new HOTP();
      const secret = BASE_SECRET;
      const token = hotp.generate(secret, 0);

      expect(hotp.check(token, secret, 1)).toBe(false);
    });
  });

  describe("verify", () => {
    it("should verify with object-based API", () => {
      const hotp = new HOTP();
      const secret = BASE_SECRET;
      const token = hotp.generate(secret, 0);

      expect(hotp.verify({ token, secret, counter: 0 })).toBe(true);
    });

    it("should throw for non-object argument", () => {
      const hotp = new HOTP();

      expect(() => {
        // @ts-expect-error - Testing invalid argument
        hotp.verify("invalid");
      }).toThrow("Expecting argument 0 of verify to be an object");
    });
  });

  describe("keyuri", () => {
    it("should generate valid otpauth URI", () => {
      const hotp = new HOTP();
      const uri = hotp.keyuri("user@example.com", "MyApp", BASE_SECRET_BASE32, 0);

      expect(uri).toContain("otpauth://hotp/");
      expect(uri).toContain("user%40example.com");
      expect(uri).toContain("issuer=MyApp");
      expect(uri).toContain(`secret=${BASE_SECRET_BASE32}`);
      expect(uri).toContain("counter=0");
    });
  });
  describe("RFC4226 - specific vectors", () => {
    // RFC 4226 Secret (20 bytes)
    const secret = BASE_SECRET;

    it("should match RFC 4226 SHA1 vectors", () => {
      const hotp = new HOTP({
        algorithm: HashAlgorithms.SHA1,
        digits: 6,
      });

      RFC4226_VECTORS.forEach(({ counter, expected }) => {
        expect(hotp.generate(secret, counter)).toBe(expected);
      });
    });
  });

  describe("HOTP counter parity", () => {
    // Secret must be at least 16 bytes (128 bits)
    const secret = BASE_SECRET;

    it("should verify token at specific counter", () => {
      const hotp = new HOTP();
      const token = hotp.generate(secret, 5);

      expect(hotp.check(token, secret, 5)).toBe(true);
      expect(hotp.check(token, secret, 4)).toBe(false);
      expect(hotp.check(token, secret, 6)).toBe(false);
    });

    it("should allow options overrides in verify", () => {
      const hotp = new HOTP();

      // Checking with wrong token digits should fail if token was generated with 6 default
      // But let's test specific option:
      const hotp8 = new HOTP({ digits: 8 });
      const token8 = hotp8.generate(secret, 5);

      // Verify with instance options
      expect(hotp8.check(token8, secret, 5)).toBe(true);
      expect(hotp.check(token8, secret, 5)).toBe(false); // 6 digits expected
    });
  });

  describe("options getter", () => {
    it("should return merged default and instance options", () => {
      const hotp = new HOTP<HOTPOptions>({ algorithm: "sha1" });
      hotp.options = { digits: 8 };

      const opts = hotp.options;

      expect(opts.algorithm).toBe("sha1");
      expect(opts.digits).toBe(8);
    });
  });

  describe("secretToBytes encoding support", () => {
    it("should decode Base32-encoded secrets", () => {
      const hotp = new HOTP({ encoding: KeyEncodings.BASE32 });
      // Base32 encoding of "12345678901234567890" (BASE_SECRET)
      const base32EncodedSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
      const token = hotp.generate(base32EncodedSecret, 0);

      expect(token).toHaveLength(6);
      expect(token).toMatch(/^\d{6}$/);

      // Verify the token matches ASCII version
      const hotpAscii = new HOTP({ encoding: KeyEncodings.ASCII });
      const tokenAscii = hotpAscii.generate(BASE_SECRET, 0);
      expect(token).toBe(tokenAscii);
    });

    it("should decode hex-encoded secrets", () => {
      // "12345678901234567890" as hex
      const hexSecret = "3132333435363738393031323334353637383930";
      const hotp = new HOTP({ encoding: KeyEncodings.HEX });
      const token = hotp.generate(hexSecret, 0);

      expect(token).toHaveLength(6);
      expect(token).toMatch(/^\d{6}$/);

      // Verify against ASCII version to confirm same result
      const hotpAscii = new HOTP({ encoding: KeyEncodings.ASCII });
      const tokenAscii = hotpAscii.generate(BASE_SECRET, 0);

      expect(token).toBe(tokenAscii);
    });

    it("should reject hex secrets with 0x prefix", () => {
      const hexSecret = "0x3132333435363738393031323334353637383930";
      const hotp = new HOTP({ encoding: KeyEncodings.HEX });

      expect(() => hotp.generate(hexSecret, 0)).toThrow();
    });

    it("should handle hex secrets with spaces", () => {
      // Same hex with spaces
      const hexSecretWithSpaces = "31 32 33 34 35 36 37 38 39 30 31 32 33 34 35 36 37 38 39 30";
      const hotp = new HOTP({ encoding: KeyEncodings.HEX });
      const token = hotp.generate(hexSecretWithSpaces, 0);

      // Verify against ASCII version to confirm spaces are stripped
      const hotpAscii = new HOTP({ encoding: KeyEncodings.ASCII });
      const tokenAscii = hotpAscii.generate(BASE_SECRET, 0);

      expect(token).toBe(tokenAscii);
    });
  });

  describe("hotpDigestToToken", () => {
    it("should convert hex digest to token", () => {
      // RFC 4226 test vector: counter=0, HMAC = cc93cf18508d94934c64b65d8ba7667fb7cde4b0
      // Expected truncation for 6 digits: 755224
      const hexDigest = "cc93cf18508d94934c64b65d8ba7667fb7cde4b0";
      const token = hotpDigestToToken(hexDigest, 6);

      expect(token).toHaveLength(6);
      expect(token).toMatch(/^\d{6}$/);
      expect(token).toBe("755224");
    });

    it("should convert digest to 8-digit token", () => {
      const hexDigest = "cc93cf18508d94934c64b65d8ba7667fb7cde4b0";
      const token = hotpDigestToToken(hexDigest, 8);

      expect(token).toHaveLength(8);
      expect(token).toMatch(/^\d{8}$/);
    });
  });
});
