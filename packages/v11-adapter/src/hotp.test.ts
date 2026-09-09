import { describe, it, expect } from "vitest";
import { CryptoPlugin, createGuardrails } from "@otplib/core";
import { HOTP, HashAlgorithms, KeyEncodings, type HOTPOptions } from "./index.js";
import { secretToBytes } from "./hotp.js";
import {
  RFC4226_VECTORS,
  RFC_TEST_SECRET,
  TEST_SECRET_PARSE_BASE32,
  TEST_SECRET_RFC_BASE32,
  TEST_SECRET_HEX,
  TEST_SECRET_HEX_INVALID,
} from "@repo/testing";

describe("HOTP (v11-adapter)", () => {
  it("should match RFC 4226 vectors", () => {
    const hotp = new HOTP({
      algorithm: HashAlgorithms.SHA1,
      digits: 6,
    });

    RFC4226_VECTORS.forEach(({ counter, expected }) => {
      expect(hotp.generate(RFC_TEST_SECRET, counter)).toBe(expected);
    });
  });

  it("should check token correctly", () => {
    const hotp = new HOTP();
    const token = hotp.generate(RFC_TEST_SECRET, 0);
    expect(hotp.check(token, RFC_TEST_SECRET, 0)).toBe(true);
    expect(hotp.check(token, RFC_TEST_SECRET, 1)).toBe(false);
  });

  it("should support hex encoding", () => {
    const hotp = new HOTP();
    const secret = TEST_SECRET_HEX;

    // Set explicit encoding in options
    hotp.options = { encoding: "hex" };
    const token = hotp.generate(secret, 0);

    expect(hotp.check(token, secret, 0)).toBe(true);
  });

  it("should reject hex encoding with 0x prefix", () => {
    const hotp = new HOTP();
    const secret = TEST_SECRET_HEX_INVALID;

    hotp.options = { encoding: "hex" };

    expect(() => hotp.generate(secret, 0)).toThrow();
  });

  it("should support base32 encoding", () => {
    const hotp = new HOTP();
    // > 16 bytes
    const secret = TEST_SECRET_PARSE_BASE32.repeat(2);

    hotp.options = { encoding: "base32" };
    const token = hotp.generate(secret, 0);

    expect(hotp.check(token, secret, 0)).toBe(true);
  });

  describe("secretToBytes encoding support", () => {
    it("should decode base64-encoded secrets", () => {
      const base64Secret = Buffer.from(RFC_TEST_SECRET, "utf8").toString("base64");
      const hotp = new HOTP({ encoding: KeyEncodings.BASE64 });
      const token = hotp.generate(base64Secret, 0);

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

  describe("base64 compatibility (Node Buffer.from parity)", () => {
    // Bytes chosen so the Base64 encoding contains both "+" and "/", so the
    // URL-safe-alphabet cases actually exercise the "-"/"_" mapping instead
    // of coincidentally being identical to the standard-alphabet strings.
    const PADDED = "AM+R//4=";
    const UNPADDED = "AM+R//4";
    const WHITESPACE = "AM+R \n //4=";
    const URL_SAFE = "AM-R__4=";
    const URL_SAFE_UNPADDED = "AM-R__4";

    it.each([
      ["unpadded", UNPADDED],
      ["padded", PADDED],
      ["embedded spaces and newlines", WHITESPACE],
      ["URL-safe alphabet (- and _)", URL_SAFE],
      ["URL-safe alphabet, unpadded", URL_SAFE_UNPADDED],
    ])("should match Buffer.from semantics for %s base64 input", (_label, input) => {
      const expected = new Uint8Array(Buffer.from(input, "base64"));

      expect(secretToBytes(input, KeyEncodings.BASE64)).toEqual(expected);
    });

    it("should generate the same HOTP token from an unpadded base64 secret as from the equivalent base32 secret", () => {
      const unpaddedBase64Secret = Buffer.from(RFC_TEST_SECRET, "utf8")
        .toString("base64")
        .replace(/=+$/, "");
      const hotpBase64 = new HOTP({ encoding: KeyEncodings.BASE64 });
      const tokenBase64 = hotpBase64.generate(unpaddedBase64Secret, 0);

      const hotpBase32 = new HOTP({ encoding: KeyEncodings.BASE32 });
      const tokenBase32 = hotpBase32.generate(TEST_SECRET_RFC_BASE32, 0);

      expect(tokenBase64).toBe(tokenBase32);
    });

    it("should throw on genuinely invalid characters instead of silently discarding them like Node", () => {
      // Node's `Buffer.from("ab!!cd", "base64")` silently drops the "!!"
      // and decodes as though it read "abcd". This library's `base64ToBytes`
      // (see hotp.ts) intentionally does NOT replicate that: a secret is a
      // security-sensitive value, so a mistyped/corrupted secret should
      // throw rather than silently resolve to a different key.
      expect(() => secretToBytes("ab!!cd", KeyEncodings.BASE64)).toThrow();
    });

    it.each([
      ["AB", [0x00]],
      ["QR==", [0x41]],
      ["AA/", [0x00, 0x0f]],
      ["a", []],
    ])(
      "should throw on non-canonical base64 input %j, which Node decodes to %j",
      (input, expectedNodeBytes) => {
        // Pin what Node actually does, so this test documents the
        // divergence rather than just asserting a throw in isolation.
        expect([...Buffer.from(input, "base64")]).toEqual(expectedNodeBytes);
        expect(() => secretToBytes(input, KeyEncodings.BASE64)).toThrow();
      },
    );
  });

  it("should apply guardrails from constructor", () => {
    const strictGuardrails = createGuardrails({ MIN_SECRET_BYTES: 100, MAX_SECRET_BYTES: 200 });
    const hotp = new HOTP({ guardrails: strictGuardrails });

    expect(() => hotp.generate(RFC_TEST_SECRET, 0)).toThrow();
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
    const token = hotp.generate(RFC_TEST_SECRET, 0);
    expect(hotp.verify({ token, secret: RFC_TEST_SECRET, counter: 0 })).toBe(true);
  });

  it("should verify throw on invalid argument", () => {
    const hotp = new HOTP();
    // @ts-expect-error - testing runtime check
    expect(() => hotp.verify("invalid")).toThrow("Expecting argument 0");
  });

  it("should generate keyuri", () => {
    const hotp = new HOTP();
    const uri = hotp.keyuri("user", "issuer", RFC_TEST_SECRET, 5);
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
    expect(hotp.check("123456", RFC_TEST_SECRET, 0)).toBe(false);
  });
});
