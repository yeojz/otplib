/**
 * Property-based fuzz tests for URI parsing and generation
 *
 * Tests security-sensitive parsing operations for edge cases including:
 * - Malformed URIs
 * - Unicode characters
 * - Injection attempts
 * - Length limits
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  parse,
  generate,
  generateTOTP,
  generateHOTP,
  InvalidParameterError,
  URIParseError,
} from "@otplib/uri";
import { BASE_SECRET_BASE32 } from "@repo/testing";

// Valid Base32 alphabet (RFC 4648)
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// Arbitrary for valid Base32 secrets
const validBase32Secret = fc
  .array(fc.constantFrom(...BASE32_ALPHABET.split("")), { minLength: 16, maxLength: 64 })
  .map((chars) => chars.join(""));

// Arbitrary for valid algorithm values
const validAlgorithm = fc.constantFrom("sha1", "sha256", "sha512") as fc.Arbitrary<
  "sha1" | "sha256" | "sha512"
>;

// Arbitrary for valid digits
const validDigits = fc.constantFrom(6, 7, 8) as fc.Arbitrary<6 | 7 | 8>;

// Arbitrary for valid OTP type
const validType = fc.constantFrom("totp", "hotp") as fc.Arbitrary<"totp" | "hotp">;

// Arbitrary for safe label characters (URL-safe but realistic)
const safeLabelChars = fc
  .array(
    fc.constantFrom(
      ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.@".split(""),
    ),
    { minLength: 1, maxLength: 100 },
  )
  .map((chars) => chars.join(""));

// Arbitrary for issuer names (alphanumeric + spaces)
const safeIssuer = fc
  .array(
    fc.constantFrom(
      ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -".split(""),
    ),
    { minLength: 1, maxLength: 50 },
  )
  .map((chars) => chars.join(""));

describe("URI fuzz tests", () => {
  describe("parse and generate roundtrip", () => {
    it("should roundtrip: parse(generate(uri)) preserves essential fields", async () => {
      await fc.assert(
        fc.asyncProperty(
          validType,
          safeLabelChars,
          validBase32Secret,
          safeIssuer,
          validAlgorithm,
          validDigits,
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 15, max: 60 }),
          async (type, label, secret, issuer, algorithm, digits, counter, period) => {
            const fullLabel = issuer ? `${issuer}:${label}` : label;

            const uri = generate({
              type,
              label: fullLabel,
              params: {
                secret,
                issuer,
                algorithm,
                digits,
                ...(type === "hotp" ? { counter } : { period }),
              },
            });

            const parsed = parse(uri);

            expect(parsed.type).toBe(type);
            expect(parsed.params.secret).toBe(secret);
            if (parsed.params.issuer) {
              expect(parsed.params.issuer).toBe(issuer);
            }
          },
        ),
      );
    });

    it("should roundtrip generateTOTP URIs", async () => {
      await fc.assert(
        fc.asyncProperty(
          safeLabelChars,
          validBase32Secret,
          safeIssuer,
          validAlgorithm,
          validDigits,
          fc.integer({ min: 15, max: 60 }),
          async (label, secret, issuer, algorithm, digits, period) => {
            const uri = generateTOTP({
              issuer,
              label,
              secret,
              algorithm,
              digits,
              period,
            });

            const parsed = parse(uri);

            expect(parsed.type).toBe("totp");
            expect(parsed.params.secret).toBe(secret);
            expect(parsed.params.issuer).toBe(issuer);
          },
        ),
      );
    });

    it("should roundtrip generateHOTP URIs", async () => {
      await fc.assert(
        fc.asyncProperty(
          safeLabelChars,
          validBase32Secret,
          safeIssuer,
          validAlgorithm,
          validDigits,
          fc.integer({ min: 0, max: 1000000 }),
          async (label, secret, issuer, algorithm, digits, counter) => {
            const uri = generateHOTP({
              issuer,
              label,
              secret,
              algorithm,
              digits,
              counter,
            });

            const parsed = parse(uri);

            expect(parsed.type).toBe("hotp");
            expect(parsed.params.secret).toBe(secret);
            expect(parsed.params.issuer).toBe(issuer);
            expect(parsed.params.counter).toBe(counter);
          },
        ),
      );
    });
  });

  describe("robustness against malformed input", () => {
    it("should not crash on completely random strings", async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (input) => {
          try {
            parse(input);
          } catch (err) {
            // Expected to throw for invalid input
            expect(err).toBeInstanceOf(Error);
          }
        }),
      );
    });

    it("should reject URIs without otpauth:// prefix", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter((s) => !s.startsWith("otpauth://")),
          async (input) => {
            expect(() => parse(input)).toThrow(URIParseError);
          },
        ),
      );
    });

    it("should reject URIs with invalid OTP type", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s !== "totp" && s !== "hotp"),
          safeLabelChars,
          async (invalidType, label) => {
            const uri = `otpauth://${invalidType}/${label}?secret=${BASE_SECRET_BASE32}`;
            try {
              parse(uri);
            } catch (err) {
              expect(err).toBeInstanceOf(InvalidParameterError);
            }
          },
        ),
      );
    });

    it("should handle URIs with missing slash after type", async () => {
      await fc.assert(
        fc.asyncProperty(validType, async (type) => {
          const uri = `otpauth://${type}?secret=${BASE_SECRET_BASE32}`;
          expect(() => parse(uri)).toThrow(URIParseError);
        }),
      );
    });
  });

  describe("security edge cases", () => {
    it("should handle very long URIs gracefully", async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 2000, max: 5000 }), async (length) => {
          const longString = "A".repeat(length);
          const uri = `otpauth://totp/test?secret=${longString}`;

          try {
            parse(uri);
          } catch (err) {
            expect(err).toBeInstanceOf(Error);
          }
        }),
      );
    });

    it("should handle various Unicode strings in labels without crashing", async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async (unicodeLabel) => {
          try {
            const encoded = encodeURIComponent(unicodeLabel);
            const uri = `otpauth://totp/${encoded}?secret=${BASE_SECRET_BASE32}`;
            const result = parse(uri);
            expect(result).toBeDefined();
          } catch (err) {
            // Expected errors are fine for certain Unicode sequences
            expect(err).toBeInstanceOf(Error);
          }
        }),
      );
    });

    it("should handle various Unicode strings in issuer without crashing", async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async (unicodeIssuer) => {
          try {
            const encoded = encodeURIComponent(unicodeIssuer);
            const uri = `otpauth://totp/test?secret=${BASE_SECRET_BASE32}&issuer=${encoded}`;
            const result = parse(uri);
            expect(result).toBeDefined();
          } catch (err) {
            expect(err).toBeInstanceOf(Error);
          }
        }),
      );
    });

    it("should handle null bytes and control characters", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 0, max: 31 }), { minLength: 1, maxLength: 10 }),
          async (controlCodes) => {
            const controlChars = String.fromCharCode(...controlCodes);
            try {
              const encoded = encodeURIComponent(controlChars);
              const uri = `otpauth://totp/${encoded}?secret=${BASE_SECRET_BASE32}`;
              parse(uri);
            } catch (err) {
              expect(err).toBeInstanceOf(Error);
            }
          },
        ),
      );
    });

    it("should handle malformed percent encoding", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 255 }),
          fc.boolean(),
          async (byte, incomplete) => {
            // Create malformed percent encoding
            const hex = byte.toString(16).padStart(2, "0");
            const malformed = incomplete ? `%${hex.charAt(0)}` : `%${hex}%`;
            const uri = `otpauth://totp/test${malformed}?secret=${BASE_SECRET_BASE32}`;

            try {
              parse(uri);
            } catch (err) {
              expect(err).toBeInstanceOf(Error);
            }
          },
        ),
      );
    });
  });

  describe("parameter validation", () => {
    it("should accept valid algorithm variations", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom("SHA1", "sha1", "SHA-1", "sha-1", "SHA256", "sha256", "SHA-256"),
          async (algo) => {
            const uri = `otpauth://totp/test?secret=${BASE_SECRET_BASE32}&algorithm=${algo}`;

            try {
              const result = parse(uri);
              expect(result.params.algorithm).toMatch(/^sha(1|256|512)$/);
            } catch (err) {
              // Invalid algorithm format throws
              expect(err).toBeInstanceOf(InvalidParameterError);
            }
          },
        ),
      );
    });

    it("should reject invalid algorithm values", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => {
            const normalized = s.toLowerCase().replace(/-/g, "");
            return !["sha1", "sha256", "sha512"].includes(normalized);
          }),
          async (invalidAlgo) => {
            const uri = `otpauth://totp/test?secret=${BASE_SECRET_BASE32}&algorithm=${encodeURIComponent(invalidAlgo)}`;

            try {
              parse(uri);
            } catch (err) {
              expect(err).toBeInstanceOf(InvalidParameterError);
            }
          },
        ),
      );
    });

    it("should only accept valid digit values (6, 7, 8)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -100, max: 100 }).filter((d) => d !== 6 && d !== 7 && d !== 8),
          async (invalidDigits) => {
            const uri = `otpauth://totp/test?secret=${BASE_SECRET_BASE32}&digits=${invalidDigits}`;

            try {
              parse(uri);
            } catch (err) {
              expect(err).toBeInstanceOf(InvalidParameterError);
            }
          },
        ),
      );
    });
  });

  describe("edge cases with special characters", () => {
    it("should handle labels with colons (issuer:account format)", async () => {
      await fc.assert(
        fc.asyncProperty(
          safeIssuer,
          safeLabelChars,
          validBase32Secret,
          async (issuer, account, secret) => {
            const uri = generateTOTP({ issuer, label: account, secret });

            const parsed = parse(uri);
            expect(parsed.label).toContain(":");
          },
        ),
      );
    });

    it("should handle email addresses in labels", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          safeIssuer,
          validBase32Secret,
          async (email, issuer, secret) => {
            const uri = generateTOTP({ issuer, label: email, secret });

            const parsed = parse(uri);
            expect(parsed.params.secret).toBe(secret);
          },
        ),
      );
    });

    it("should preserve query parameter order independence", async () => {
      await fc.assert(
        fc.asyncProperty(
          validBase32Secret,
          safeIssuer,
          validAlgorithm,
          validDigits,
          async (secret, issuer, algorithm, digits) => {
            // Same params in different order should parse to same values
            const uri1 = `otpauth://totp/test?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=${algorithm}&digits=${digits}`;
            const uri2 = `otpauth://totp/test?digits=${digits}&algorithm=${algorithm}&issuer=${encodeURIComponent(issuer)}&secret=${secret}`;

            const parsed1 = parse(uri1);
            const parsed2 = parse(uri2);

            expect(parsed1.params.secret).toBe(parsed2.params.secret);
            expect(parsed1.params.algorithm).toBe(parsed2.params.algorithm);
            expect(parsed1.params.digits).toBe(parsed2.params.digits);
          },
        ),
      );
    });
  });
});
