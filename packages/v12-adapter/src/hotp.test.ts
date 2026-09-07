/**
 * @otplib/v12-adapter
 *
 * HOTP class tests - verifying v12 API compatibility
 */

import { describe, it, expect } from "vitest";
import { createGuardrails } from "@otplib/core";
import { HOTP, HashAlgorithms, KeyEncodings, hotpDigestToToken, type HOTPOptions } from "./index";
import { secretToBytes } from "./hotp.js";
import {
  RFC4226_VECTORS,
  RFC_TEST_SECRET,
  TEST_SECRET_PARSE_BASE32,
  TEST_SECRET_RFC_BASE32,
  RFC_TEST_SECRET_HEX,
  TEST_SECRET_RFC_HEX_INVALID,
} from "@repo/testing";

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
      const secret = RFC_TEST_SECRET;
      const token = hotp.generate(secret, 0);

      expect(token).toHaveLength(6);
      expect(token).toMatch(/^\d{6}$/);
    });

    it("should generate token for specific counter", () => {
      const hotp = new HOTP();
      const secret = RFC_TEST_SECRET;
      const token0 = hotp.generate(secret, 0);
      const token1 = hotp.generate(secret, 1);

      expect(token0).not.toBe(token1);
    });

    it("should support 8-digit tokens", () => {
      const hotp = new HOTP({ digits: 8 });
      const secret = RFC_TEST_SECRET;
      const token = hotp.generate(secret, 0);

      expect(token).toHaveLength(8);
      expect(token).toMatch(/^\d{8}$/);
    });

    it("should apply guardrails from constructor", () => {
      const strictGuardrails = createGuardrails({ MIN_SECRET_BYTES: 100, MAX_SECRET_BYTES: 200 });
      const hotp = new HOTP({ guardrails: strictGuardrails });

      expect(() => hotp.generate(RFC_TEST_SECRET, 0)).toThrow();
    });
  });

  describe("check", () => {
    it("should return true for valid token", () => {
      const hotp = new HOTP();
      const secret = RFC_TEST_SECRET;
      const token = hotp.generate(secret, 0);

      expect(hotp.check(token, secret, 0)).toBe(true);
    });

    it("should return false for invalid token", () => {
      const hotp = new HOTP();
      const secret = RFC_TEST_SECRET;

      expect(hotp.check("000000", secret, 0)).toBe(false);
    });

    it("should return false for wrong counter", () => {
      const hotp = new HOTP();
      const secret = RFC_TEST_SECRET;
      const token = hotp.generate(secret, 0);

      expect(hotp.check(token, secret, 1)).toBe(false);
    });
  });

  describe("verify", () => {
    it("should verify with object-based API", () => {
      const hotp = new HOTP();
      const secret = RFC_TEST_SECRET;
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
      const uri = hotp.keyuri("user@example.com", "MyApp", TEST_SECRET_PARSE_BASE32, 0);

      expect(uri).toContain("otpauth://hotp/");
      expect(uri).toContain("user%40example.com");
      expect(uri).toContain("issuer=MyApp");
      expect(uri).toContain(`secret=${TEST_SECRET_PARSE_BASE32}`);
      expect(uri).toContain("counter=0");
    });
  });
  describe("RFC4226 - specific vectors", () => {
    // RFC 4226 Secret (20 bytes)
    const secret = RFC_TEST_SECRET;

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
    const secret = RFC_TEST_SECRET;

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
      // Base32 encoding of "12345678901234567890" (RFC_TEST_SECRET)
      const base32EncodedSecret = TEST_SECRET_RFC_BASE32;
      const token = hotp.generate(base32EncodedSecret, 0);

      expect(token).toHaveLength(6);
      expect(token).toMatch(/^\d{6}$/);

      // Verify the token matches ASCII version
      const hotpAscii = new HOTP({ encoding: KeyEncodings.ASCII });
      const tokenAscii = hotpAscii.generate(RFC_TEST_SECRET, 0);
      expect(token).toBe(tokenAscii);
    });

    it("should decode hex-encoded secrets", () => {
      const hexSecret = RFC_TEST_SECRET_HEX;
      const hotp = new HOTP({ encoding: KeyEncodings.HEX });
      const token = hotp.generate(hexSecret, 0);

      expect(token).toHaveLength(6);
      expect(token).toMatch(/^\d{6}$/);

      // Verify against ASCII version to confirm same result
      const hotpAscii = new HOTP({ encoding: KeyEncodings.ASCII });
      const tokenAscii = hotpAscii.generate(RFC_TEST_SECRET, 0);

      expect(token).toBe(tokenAscii);
    });

    it("should reject hex secrets with 0x prefix", () => {
      const hexSecret = TEST_SECRET_RFC_HEX_INVALID;
      const hotp = new HOTP({ encoding: KeyEncodings.HEX });

      expect(() => hotp.generate(hexSecret, 0)).toThrow();
    });

    it("should handle hex secrets with spaces", () => {
      const hexSecretWithSpaces = RFC_TEST_SECRET_HEX.replace(/(..)/g, "$1 ").trim();
      const hotp = new HOTP({ encoding: KeyEncodings.HEX });
      const token = hotp.generate(hexSecretWithSpaces, 0);

      // Verify against ASCII version to confirm spaces are stripped
      const hotpAscii = new HOTP({ encoding: KeyEncodings.ASCII });
      const tokenAscii = hotpAscii.generate(RFC_TEST_SECRET, 0);

      expect(token).toBe(tokenAscii);
    });

    it("should decode base64-encoded secrets", () => {
      const base64Secret = Buffer.from(RFC_TEST_SECRET, "utf8").toString("base64");
      const hotp = new HOTP({ encoding: KeyEncodings.BASE64 });
      const token = hotp.generate(base64Secret, 0);

      expect(token).toHaveLength(6);
      expect(token).toMatch(/^\d{6}$/);

      // Verify against ASCII version to confirm same result
      const hotpAscii = new HOTP({ encoding: KeyEncodings.ASCII });
      const tokenAscii = hotpAscii.generate(RFC_TEST_SECRET, 0);

      expect(token).toBe(tokenAscii);
    });

    it("should decode base64-encoded secrets identically to base32-encoded secrets (end-to-end)", () => {
      const base64Secret = Buffer.from(RFC_TEST_SECRET, "utf8").toString("base64");
      const hotpBase64 = new HOTP({ encoding: KeyEncodings.BASE64 });
      const tokenBase64 = hotpBase64.generate(base64Secret, 0);

      const hotpBase32 = new HOTP({ encoding: KeyEncodings.BASE32 });
      const tokenBase32 = hotpBase32.generate(TEST_SECRET_RFC_BASE32, 0);

      expect(tokenBase64).toBe(tokenBase32);
    });

    it("should decode latin1-encoded secrets by taking the low byte of each code unit", () => {
      // 16 chars (>= MIN_SECRET_BYTES); includes a code unit above 0xFF
      // (U+0141) to exercise the truncation path.
      const secret = "abcdefghijklmnoŁ";
      const hotp = new HOTP({ encoding: KeyEncodings.LATIN1 });
      const token = hotp.generate(secret, 0);

      const expectedBytes = Buffer.from(secret, "latin1");
      const hotpHex = new HOTP({ encoding: KeyEncodings.HEX });
      const tokenFromExpectedBytes = hotpHex.generate(expectedBytes.toString("hex"), 0);

      expect(token).toBe(tokenFromExpectedBytes);
    });

    it("should treat ascii encoding the same as latin1 (Node semantics)", () => {
      const secret = "abcdefghijklmnoŁ";
      const hotpAscii = new HOTP({ encoding: KeyEncodings.ASCII });
      const hotpLatin1 = new HOTP({ encoding: KeyEncodings.LATIN1 });

      expect(hotpAscii.generate(secret, 0)).toBe(hotpLatin1.generate(secret, 0));
    });

    it("should decode utf8-encoded secrets distinctly from latin1/ascii", () => {
      const secret = "abcdefghijklmnoŁ";
      const hotpUtf8 = new HOTP({ encoding: KeyEncodings.UTF8 });
      const hotpLatin1 = new HOTP({ encoding: KeyEncodings.LATIN1 });

      // Multi-byte UTF-8 sequences produce a different key than the
      // single-byte-per-code-unit latin1/ascii conversion.
      expect(hotpUtf8.generate(secret, 0)).not.toBe(hotpLatin1.generate(secret, 0));
    });
  });

  describe("secretToBytes byte-vector coverage", () => {
    it("should match Buffer.from semantics for base64 encoding", () => {
      const secret = "SGVsbG8gV29ybGQ=";
      const expected = new Uint8Array(Buffer.from(secret, "base64"));

      expect(secretToBytes(secret, KeyEncodings.BASE64)).toEqual(expected);
    });

    it("should match Buffer.from semantics for latin1 encoding", () => {
      const secret = "abcéŁ";
      const expected = new Uint8Array(Buffer.from(secret, "latin1"));

      expect(secretToBytes(secret, KeyEncodings.LATIN1)).toEqual(expected);
    });

    it("should match Buffer.from semantics for ascii encoding", () => {
      const secret = "abcéŁ";
      const expected = new Uint8Array(Buffer.from(secret, "ascii"));

      expect(secretToBytes(secret, KeyEncodings.ASCII)).toEqual(expected);
    });

    it("should match Buffer.from semantics for utf8 encoding", () => {
      const secret = "abcéŁ";
      const expected = new Uint8Array(Buffer.from(secret, "utf8"));

      expect(secretToBytes(secret, KeyEncodings.UTF8)).toEqual(expected);
    });

    it("should match Buffer.from semantics for unrecognised encodings (utf8 fallback)", () => {
      const secret = "abcéŁ";
      const expected = new Uint8Array(Buffer.from(secret, "utf8"));

      expect(secretToBytes(secret, "not-a-real-encoding")).toEqual(expected);
    });

    it("should default to UTF-8 bytes when encoding is undefined", () => {
      const secret = "abcéŁ";
      const expected = new Uint8Array(Buffer.from(secret, "utf8"));

      expect(secretToBytes(secret)).toEqual(expected);
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
