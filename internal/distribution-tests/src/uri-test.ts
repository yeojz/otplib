/**
 * Shared URI distribution test suite
 *
 * Tests the URI package using built artifacts (dist/).
 */

import { parse, InvalidURIError, InvalidParameterError } from "@otplib/uri";

import type { TestContext } from "@repo/testing";

/**
 * Creates the URI distribution test suite with injected dependencies
 */
export function createURIDistributionTests(ctx: TestContext): void {
  const { describe, it, expect } = ctx;

  describe("URI Distribution", () => {
    describe("parse", () => {
      describe("valid TOTP URIs", () => {
        it("should parse basic TOTP URI", () => {
          const result = parse("otpauth://totp/ACME:john@example.com?secret=JBSWY3DPEHPK3PXP");

          expect(result.type).toBe("totp");
          expect(result.label).toBe("ACME:john@example.com");
          expect(result.params.secret).toBe("JBSWY3DPEHPK3PXP");
        });

        it("should parse TOTP URI with issuer parameter", () => {
          const result = parse(
            "otpauth://totp/ACME:john@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME",
          );

          expect(result.type).toBe("totp");
          expect(result.params.secret).toBe("JBSWY3DPEHPK3PXP");
          expect(result.params.issuer).toBe("ACME");
        });

        it("should parse TOTP URI with all parameters", () => {
          const result = parse(
            "otpauth://totp/GitHub:user1?secret=ABC123&issuer=GitHub&algorithm=SHA256&digits=8&period=60",
          );

          expect(result.type).toBe("totp");
          expect(result.label).toBe("GitHub:user1");
          expect(result.params.secret).toBe("ABC123");
          expect(result.params.issuer).toBe("GitHub");
          expect(result.params.algorithm).toBe("sha256");
          expect(result.params.digits).toBe(8);
          expect(result.params.period).toBe(60);
        });

        it("should parse URI with URL-encoded label", () => {
          const result = parse("otpauth://totp/Example%20Corp%3Auser%40example.com?secret=ABC123");

          expect(result.label).toBe("Example Corp:user@example.com");
        });

        it("should throw for URI without query parameters", () => {
          expect(() => parse("otpauth://totp/TestLabel")).toThrow(
            "Missing required parameter: secret",
          );
        });
      });

      describe("valid HOTP URIs", () => {
        it("should parse basic HOTP URI", () => {
          const result = parse("otpauth://hotp/Service:user?secret=ABC123&counter=5");

          expect(result.type).toBe("hotp");
          expect(result.label).toBe("Service:user");
          expect(result.params.secret).toBe("ABC123");
          expect(result.params.counter).toBe(5);
        });

        it("should parse HOTP URI with all parameters", () => {
          const result = parse(
            "otpauth://hotp/MyApp:admin?secret=XYZ789&issuer=MyApp&algorithm=SHA512&digits=7&counter=100",
          );

          expect(result.type).toBe("hotp");
          expect(result.params.algorithm).toBe("sha512");
          expect(result.params.digits).toBe(7);
          expect(result.params.counter).toBe(100);
        });
      });

      describe("algorithm parsing", () => {
        it("should normalize SHA1 algorithm", () => {
          const result = parse("otpauth://totp/Test?secret=ABC&algorithm=SHA1");
          expect(result.params.algorithm).toBe("sha1");
        });

        it("should normalize SHA-1 algorithm", () => {
          const result = parse("otpauth://totp/Test?secret=ABC&algorithm=SHA-1");
          expect(result.params.algorithm).toBe("sha1");
        });

        it("should normalize SHA256 algorithm", () => {
          const result = parse("otpauth://totp/Test?secret=ABC&algorithm=SHA256");
          expect(result.params.algorithm).toBe("sha256");
        });

        it("should normalize SHA-256 algorithm", () => {
          const result = parse("otpauth://totp/Test?secret=ABC&algorithm=SHA-256");
          expect(result.params.algorithm).toBe("sha256");
        });

        it("should normalize SHA512 algorithm", () => {
          const result = parse("otpauth://totp/Test?secret=ABC&algorithm=SHA512");
          expect(result.params.algorithm).toBe("sha512");
        });

        it("should normalize SHA-512 algorithm", () => {
          const result = parse("otpauth://totp/Test?secret=ABC&algorithm=SHA-512");
          expect(result.params.algorithm).toBe("sha512");
        });

        it("should throw for invalid algorithm", () => {
          expect(() => parse("otpauth://totp/Test?secret=ABC&algorithm=MD5")).toThrow(
            InvalidParameterError,
          );
        });
      });

      describe("digits parsing", () => {
        it("should parse 6 digits", () => {
          const result = parse("otpauth://totp/Test?secret=ABC&digits=6");
          expect(result.params.digits).toBe(6);
        });

        it("should parse 7 digits", () => {
          const result = parse("otpauth://totp/Test?secret=ABC&digits=7");
          expect(result.params.digits).toBe(7);
        });

        it("should parse 8 digits", () => {
          const result = parse("otpauth://totp/Test?secret=ABC&digits=8");
          expect(result.params.digits).toBe(8);
        });

        it("should throw for invalid digits", () => {
          expect(() => parse("otpauth://totp/Test?secret=ABC&digits=5")).toThrow(
            InvalidParameterError,
          );
        });

        it("should throw for non-numeric digits", () => {
          expect(() => parse("otpauth://totp/Test?secret=ABC&digits=abc")).toThrow(
            InvalidParameterError,
          );
        });
      });

      describe("invalid URIs", () => {
        it("should throw for non-otpauth scheme", () => {
          expect(() => parse("https://example.com")).toThrow(InvalidURIError);
        });

        it("should throw for missing type", () => {
          expect(() => parse("otpauth://")).toThrow(InvalidURIError);
        });

        it("should throw for invalid type", () => {
          expect(() => parse("otpauth://invalid/Label?secret=ABC")).toThrow(InvalidParameterError);
        });

        it("should throw for URI without slash after type", () => {
          expect(() => parse("otpauth://totp")).toThrow(InvalidURIError);
        });

        it("should throw for URI exceeding max length", () => {
          const longLabel = "a".repeat(3000);
          expect(() => parse(`otpauth://totp/${longLabel}?secret=ABC`)).toThrow(InvalidURIError);
        });
      });

      describe("edge cases", () => {
        it("should throw for empty secret parameter", () => {
          expect(() => parse("otpauth://totp/Test?secret=&issuer=")).toThrow(
            "Missing required parameter: secret",
          );
        });

        it("should throw for parameters without values", () => {
          expect(() => parse("otpauth://totp/Test?secret")).toThrow(
            "Missing required parameter: secret",
          );
        });

        it("should handle special characters in issuer", () => {
          const result = parse("otpauth://totp/Test?secret=ABC&issuer=My%20App%20%26%20Co");
          expect(result.params.issuer).toBe("My App & Co");
        });

        it("should preserve case of secret", () => {
          const result = parse("otpauth://totp/Test?secret=AbCdEf123456");
          expect(result.params.secret).toBe("AbCdEf123456");
        });
      });
    });
  });
}
