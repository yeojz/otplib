import { describe, it, expect } from "vitest";
import { generateTOTP, generateHOTP, parse, generate } from "./index.js";
import { formatErrorMessage } from "./parse.js";
import { BASE_SECRET_BASE32 } from "@repo/testing";

describe("URI", () => {
  describe("generateTOTP", () => {
    it("should generate basic TOTP URI", () => {
      const uri = generateTOTP({
        issuer: "ACME Co",
        label: "john@example.com",
        secret: BASE_SECRET_BASE32,
      });

      expect(uri).toBe(
        `otpauth://totp/ACME%20Co:john%40example.com?secret=${BASE_SECRET_BASE32}&issuer=ACME%20Co`,
      );
    });

    it("should include custom parameters", () => {
      const uri = generateTOTP({
        issuer: "GitHub",
        label: "user1",
        secret: BASE_SECRET_BASE32,
        algorithm: "sha256",
        digits: 8,
        period: 60,
      });

      expect(uri).toContain("algorithm=SHA256");
      expect(uri).toContain("digits=8");
      expect(uri).toContain("period=60");
    });

    it("should properly encode special characters", () => {
      const uri = generateTOTP({
        issuer: "Test Service",
        label: "user+tag@example.com",
        secret: BASE_SECRET_BASE32,
      });

      expect(uri).toContain("Test%20Service");
      expect(uri).toContain("user%2Btag%40example.com");
    });

    it("should include algorithm parameter", () => {
      const uri = generateTOTP({
        issuer: "Service",
        label: "user",
        secret: BASE_SECRET_BASE32,
        algorithm: "sha512",
      });

      expect(uri).toContain("algorithm=SHA512");
    });

    it("should include digits parameter", () => {
      const uri = generateTOTP({
        issuer: "Service",
        label: "user",
        secret: BASE_SECRET_BASE32,
        digits: 8,
      });

      expect(uri).toContain("digits=8");
    });

    it("should include period parameter", () => {
      const uri = generateTOTP({
        issuer: "Service",
        label: "user",
        secret: BASE_SECRET_BASE32,
        period: 60,
      });

      expect(uri).toContain("period=60");
    });

    it("should use default values when not specified", () => {
      const uri = generateTOTP({
        issuer: "Service",
        label: "user",
        secret: BASE_SECRET_BASE32,
      });

      // Default values (sha1, 6 digits, 30 period) are omitted for Google Authenticator compatibility
      expect(uri).toContain(`secret=${BASE_SECRET_BASE32}`);
      expect(uri).toContain("issuer=Service");
      expect(uri).not.toContain("algorithm=");
      expect(uri).not.toContain("digits=");
      expect(uri).not.toContain("period=");
    });

    it("should handle falsy issuer at runtime (else branch coverage)", () => {
      // TypeScript enforces issuer as required, but at runtime it could be undefined
      // We use type assertion to test this code path
      const options = {
        issuer: undefined as unknown as string,
        label: "user@example.com",
        secret: BASE_SECRET_BASE32,
      };

      // This will call generateTOTP with undefined issuer
      // The ternary `issuer ? ... : account` should take the else branch
      const uri = generateTOTP(options);

      // When issuer is falsy, the label should just be the account name (no issuer: prefix)
      expect(uri).toBe(`otpauth://totp/user%40example.com?secret=${BASE_SECRET_BASE32}`);
    });
  });

  describe("generate", () => {
    it("should handle missing secret parameter (undefined branch)", () => {
      // Test the branch where params.secret is falsy
      // Note: This creates an invalid URI, but tests the code path
      const uri = generate({
        type: "totp",
        label: "Service:user",
        params: {
          secret: "",
        },
      });

      // Secret is empty, so it shouldn't appear in query params
      expect(uri).toBe("otpauth://totp/Service:user?");
    });

    it("should handle missing issuer in params", () => {
      const uri = generate({
        type: "totp",
        label: "user",
        params: {
          secret: BASE_SECRET_BASE32,
        },
      });

      expect(uri).toBe(`otpauth://totp/user?secret=${BASE_SECRET_BASE32}`);
      expect(uri).not.toContain("issuer=");
    });

    it("should handle default sha1 algorithm", () => {
      const uri = generate({
        type: "totp",
        label: "user",
        params: {
          secret: BASE_SECRET_BASE32,
          algorithm: "sha1",
        },
      });

      expect(uri).not.toContain("algorithm=");
    });

    it("should handle default 6 digits", () => {
      const uri = generate({
        type: "totp",
        label: "user",
        params: {
          secret: BASE_SECRET_BASE32,
          digits: 6,
        },
      });

      expect(uri).not.toContain("digits=");
    });

    it("should handle undefined counter for HOTP", () => {
      const uri = generate({
        type: "hotp",
        label: "user",
        params: {
          secret: BASE_SECRET_BASE32,
        },
      });

      expect(uri).not.toContain("counter=");
    });

    it("should handle default period for TOTP", () => {
      const uri = generate({
        type: "totp",
        label: "user",
        params: {
          secret: BASE_SECRET_BASE32,
          period: 30,
        },
      });

      expect(uri).not.toContain("period=");
    });
  });

  describe("generateHOTP", () => {
    it("should generate basic HOTP URI", () => {
      const uri = generateHOTP({
        issuer: "ACME Co",
        label: "john@example.com",
        secret: BASE_SECRET_BASE32,
        counter: 0,
      });

      expect(uri).toBe(
        `otpauth://hotp/ACME%20Co:john%40example.com?secret=${BASE_SECRET_BASE32}&issuer=ACME%20Co&counter=0`,
      );
    });

    it("should include counter parameter", () => {
      const uri = generateHOTP({
        issuer: "Service",
        label: "user",
        secret: BASE_SECRET_BASE32,
        counter: 42,
      });

      expect(uri).toContain("counter=42");
    });

    it("should include custom parameters", () => {
      const uri = generateHOTP({
        issuer: "Service",
        label: "user",
        secret: BASE_SECRET_BASE32,
        counter: 10,
        algorithm: "sha256",
        digits: 8,
      });

      expect(uri).toContain("algorithm=SHA256");
      expect(uri).toContain("digits=8");
      expect(uri).toContain("counter=10");
    });

    it("should properly encode special characters", () => {
      const uri = generateHOTP({
        issuer: "Test Service",
        label: "user@example.com",
        secret: BASE_SECRET_BASE32,
        counter: 0,
      });

      expect(uri).toContain("Test%20Service");
      expect(uri).toContain("user%40example.com");
    });

    it("should handle falsy issuer at runtime (else branch coverage)", () => {
      // TypeScript enforces issuer as required, but at runtime it could be undefined
      // We use type assertion to test this code path
      const options = {
        issuer: undefined as unknown as string,
        label: "user@example.com",
        secret: BASE_SECRET_BASE32,
        counter: 0,
      };

      // This will call generateHOTP with undefined issuer
      // The ternary `issuer ? ... : account` should take the else branch
      const uri = generateHOTP(options);

      // When issuer is falsy, the label should just be the account name (no issuer: prefix)
      expect(uri).toBe(`otpauth://hotp/user%40example.com?secret=${BASE_SECRET_BASE32}&counter=0`);
    });

    it("should use default values for optional parameters", () => {
      // Test that default values are used when counter, algorithm, digits are omitted
      const uri = generateHOTP({
        issuer: "TestService",
        label: "user",
        secret: BASE_SECRET_BASE32,
        // counter, algorithm, digits omitted - should use defaults
      });

      expect(uri).toContain("counter=0"); // default counter
      // algorithm=SHA1 and digits=6 are defaults, so they're NOT included in the URI
      expect(uri).not.toContain("algorithm=");
      expect(uri).not.toContain("digits=");
    });
  });

  describe("parse", () => {
    it("should parse basic TOTP URI", () => {
      const uri = `otpauth://totp/ACME%20Co:john%40example.com?secret=${BASE_SECRET_BASE32}&issuer=ACME%20Co`;
      const parsed = parse(uri);

      expect(parsed.type).toBe("totp");
      expect(parsed.label).toBe("ACME Co:john@example.com");
      expect(parsed.params.secret).toBe(BASE_SECRET_BASE32);
      expect(parsed.params.issuer).toBe("ACME Co");
    });

    it("should parse TOTP URI with custom parameters", () => {
      const uri = `otpauth://totp/Service:user?secret=${BASE_SECRET_BASE32}&issuer=Service&algorithm=sha256&digits=8&period=60`;
      const parsed = parse(uri);

      expect(parsed.params.algorithm).toBe("sha256");
      expect(parsed.params.digits).toBe(8);
      expect(parsed.params.period).toBe(60);
    });

    it("should parse HOTP URI", () => {
      const uri = `otpauth://hotp/Service:user?secret=${BASE_SECRET_BASE32}&issuer=Service&counter=10`;
      const parsed = parse(uri);

      expect(parsed.type).toBe("hotp");
      expect(parsed.params.counter).toBe(10);
    });

    it("should parse URI without issuer parameter", () => {
      const uri = `otpauth://totp/user?secret=${BASE_SECRET_BASE32}`;
      const parsed = parse(uri);

      expect(parsed.label).toBe("user");
      expect(parsed.params.secret).toBe(BASE_SECRET_BASE32);
    });

    it("should parse URI with special characters", () => {
      const uri = `otpauth://totp/Test%20Service:user%2Btest%40example.com?secret=${BASE_SECRET_BASE32}&issuer=Test%20Service`;
      const parsed = parse(uri);

      expect(parsed.label).toBe("Test Service:user+test@example.com");
      expect(parsed.params.issuer).toBe("Test Service");
    });

    it("should use default values when parameters are missing", () => {
      const uri = `otpauth://totp/user?secret=${BASE_SECRET_BASE32}`;
      const parsed = parse(uri);

      expect(parsed.params.algorithm).toBeUndefined();
      expect(parsed.params.digits).toBeUndefined();
      expect(parsed.params.period).toBeUndefined();
    });

    it("should throw on invalid URI type", () => {
      const uri = `otpauth://invalid/user?secret=${BASE_SECRET_BASE32}`;

      expect(() => parse(uri)).toThrow("Invalid value for parameter 'type'");
    });

    it("should throw on invalid URI format", () => {
      const uri = "not-a-valid-uri";

      expect(() => parse(uri)).toThrow("Invalid otpauth URI");
    });

    it("should handle URIs with extra parameters", () => {
      const uri = `otpauth://totp/Service:user?secret=${BASE_SECRET_BASE32}&unknown=value&issuer=Service`;
      const parsed = parse(uri);

      // Should still parse successfully
      expect(parsed.params.secret).toBe(BASE_SECRET_BASE32);
      expect(parsed.label).toBe("Service:user");
    });

    it("should skip query params without equals sign", () => {
      const uri = `otpauth://totp/Service:user?secret=${BASE_SECRET_BASE32}&malformed&issuer=Service`;
      const parsed = parse(uri);

      expect(parsed.params.secret).toBe(BASE_SECRET_BASE32);
      expect(parsed.params.issuer).toBe("Service");
    });

    it("should parse hyphenated algorithm names", () => {
      const sha1Uri = `otpauth://totp/Service:user?secret=${BASE_SECRET_BASE32}&algorithm=SHA-1`;
      expect(parse(sha1Uri).params.algorithm).toBe("sha1");

      const sha256Uri = `otpauth://totp/Service:user?secret=${BASE_SECRET_BASE32}&algorithm=SHA-256`;
      expect(parse(sha256Uri).params.algorithm).toBe("sha256");

      const sha512Uri = `otpauth://totp/Service:user?secret=${BASE_SECRET_BASE32}&algorithm=SHA-512`;
      expect(parse(sha512Uri).params.algorithm).toBe("sha512");
    });

    it("should throw on invalid algorithm", () => {
      const uri = `otpauth://totp/Service:user?secret=${BASE_SECRET_BASE32}&algorithm=md5`;

      expect(() => parse(uri)).toThrow("Invalid value for parameter 'algorithm'");
    });

    it("should throw on invalid digits value", () => {
      const uri5 = `otpauth://totp/Service:user?secret=${BASE_SECRET_BASE32}&digits=5`;
      expect(() => parse(uri5)).toThrow("Invalid value for parameter 'digits'");

      const uri9 = `otpauth://totp/Service:user?secret=${BASE_SECRET_BASE32}&digits=9`;
      expect(() => parse(uri9)).toThrow("Invalid value for parameter 'digits'");
    });

    it("should parse valid digits values", () => {
      const uri6 = `otpauth://totp/Service:user?secret=${BASE_SECRET_BASE32}&digits=6`;
      expect(parse(uri6).params.digits).toBe(6);

      const uri7 = `otpauth://totp/Service:user?secret=${BASE_SECRET_BASE32}&digits=7`;
      expect(parse(uri7).params.digits).toBe(7);

      const uri8 = `otpauth://totp/Service:user?secret=${BASE_SECRET_BASE32}&digits=8`;
      expect(parse(uri8).params.digits).toBe(8);
    });

    it("should throw on URI exceeding max length", () => {
      // MAX_URI_LENGTH is 2048, create URI that exceeds this
      const longLabel = "a".repeat(2100);
      const uri = `otpauth://totp/${longLabel}?secret=${BASE_SECRET_BASE32}`;

      expect(() => parse(uri)).toThrow("exceeds maximum length");
    });

    it("should throw on URI without path separator", () => {
      const uri = "otpauth://totp";

      expect(() => parse(uri)).toThrow("Invalid otpauth URI");
    });

    it("should parse URI without query string", () => {
      const uri = "otpauth://totp/user";
      expect(() => parse(uri)).toThrow("Missing required parameter: secret");
    });

    it("should throw when secret parameter is missing", () => {
      const uri = "otpauth://totp/user?issuer=Service";
      expect(() => parse(uri)).toThrow("Missing required parameter: secret");
    });

    it("should reject malformed numeric parameters", () => {
      const malformedCounter = `otpauth://hotp/user?secret=${BASE_SECRET_BASE32}&counter=10abc`;
      expect(() => parse(malformedCounter)).toThrow("Invalid value for parameter 'counter'");

      const emptyPeriod = `otpauth://totp/user?secret=${BASE_SECRET_BASE32}&period=`;
      expect(() => parse(emptyPeriod)).toThrow("Invalid value for parameter 'period'");

      const negativePeriod = `otpauth://totp/user?secret=${BASE_SECRET_BASE32}&period=-1`;
      expect(() => parse(negativePeriod)).toThrow("Invalid value for parameter 'period'");
    });

    it("should throw on label exceeding max length after decoding", () => {
      // Create a label that is small when encoded but large when decoded
      // Using encoded characters that expand when decoded
      const longLabel = encodeURIComponent("a".repeat(600));
      const uri = `otpauth://totp/${longLabel}?secret=${BASE_SECRET_BASE32}`;

      expect(() => parse(uri)).toThrow("exceeds maximum length");
    });

    it("should throw on pre-decoded label exceeding max length check", () => {
      // MAX_LABEL_LENGTH is 512, so str.length > 512 * 3 = 1536 triggers early exit
      // Need a raw string longer than 1536 chars that won't exceed URI limit of 2048
      const longLabel = "a".repeat(1600); // Exceeds 1536 but is just plain ascii
      const uri = `otpauth://totp/${longLabel}`;

      expect(() => parse(uri)).toThrow("exceeds maximum length");
    });

    it("should throw on invalid URI encoding in label", () => {
      // %ZZ is an invalid percent-encoding
      const uri = `otpauth://totp/invalid%ZZlabel?secret=${BASE_SECRET_BASE32}`;

      expect(() => parse(uri)).toThrow("Invalid URI encoding");
    });

    it("should throw on invalid URI encoding in parameter", () => {
      // %ZZ is an invalid percent-encoding
      const uri = `otpauth://totp/user?secret=${BASE_SECRET_BASE32}&issuer=bad%ZZvalue`;

      expect(() => parse(uri)).toThrow("Invalid URI encoding");
    });

    it("should handle URIError with proper message formatting", () => {
      // This tests the error message formatting in safeDecodeURIComponent
      // % is incomplete percent-encoding, which triggers URIError
      const uri = `otpauth://totp/user%?secret=${BASE_SECRET_BASE32}`;

      expect(() => parse(uri)).toThrow("Invalid URI encoding");
    });
  });

  describe("round-trip generation and parsing", () => {
    it("should generate and parse TOTP URI correctly", () => {
      const original = {
        issuer: "Test Service",
        label: "user@example.com",
        secret: BASE_SECRET_BASE32,
        algorithm: "sha256" as const,
        digits: 8 as const,
        period: 60,
      };

      const uri = generateTOTP(original);
      const parsed = parse(uri);

      expect(parsed.type).toBe("totp");
      expect(parsed.params.issuer).toBe(original.issuer);
      expect(parsed.label).toBe(`${original.issuer}:${original.label}`);
      expect(parsed.params.secret).toBe(original.secret);
      expect(parsed.params.algorithm).toBe(original.algorithm);
      expect(parsed.params.digits).toBe(original.digits);
      expect(parsed.params.period).toBe(original.period);
    });

    it("should generate and parse HOTP URI correctly", () => {
      const original = {
        issuer: "Test Service",
        label: "user@example.com",
        secret: BASE_SECRET_BASE32,
        algorithm: "sha512" as const,
        digits: 8 as const,
        counter: 42,
      };

      const uri = generateHOTP(original);
      const parsed = parse(uri);

      expect(parsed.type).toBe("hotp");
      expect(parsed.params.issuer).toBe(original.issuer);
      expect(parsed.label).toBe(`${original.issuer}:${original.label}`);
      expect(parsed.params.secret).toBe(original.secret);
      expect(parsed.params.algorithm).toBe(original.algorithm);
      expect(parsed.params.digits).toBe(original.digits);
      expect(parsed.params.counter).toBe(original.counter);
    });
  });

  describe("error classes", () => {
    it("should create MissingParameterError with correct message", async () => {
      const { MissingParameterError } = await import("./types.js");
      const error = new MissingParameterError("secret");

      expect(error.message).toBe("Missing required parameter: secret");
      expect(error.name).toBe("MissingParameterError");
    });

    it("should create URIParseError base class", async () => {
      const { URIParseError } = await import("./types.js");
      const error = new URIParseError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.name).toBe("URIParseError");
    });

    it("should create InvalidURIError with correct message", async () => {
      const { InvalidURIError } = await import("./types.js");
      const error = new InvalidURIError("invalid-uri");

      expect(error.message).toBe("Invalid otpauth URI: invalid-uri");
      expect(error.name).toBe("InvalidURIError");
    });

    it("should create InvalidParameterError with correct message", async () => {
      const { InvalidParameterError } = await import("./types.js");
      const error = new InvalidParameterError("digits", "10");

      expect(error.message).toBe("Invalid value for parameter 'digits': 10");
      expect(error.name).toBe("InvalidParameterError");
    });
  });

  describe("formatErrorMessage", () => {
    it("should format Error objects with their message", () => {
      const error = new Error("URI malformed");
      const message = formatErrorMessage(error, "label");

      expect(message).toBe("Invalid URI encoding in label: URI malformed");
    });

    it("should format non-Error objects using String()", () => {
      const message = formatErrorMessage("some string value", "parameter");

      expect(message).toBe("Invalid URI encoding in parameter: some string value");
    });

    it("should format null values", () => {
      const message = formatErrorMessage(null, "test");

      expect(message).toBe("Invalid URI encoding in test: null");
    });

    it("should format undefined values", () => {
      const message = formatErrorMessage(undefined, "test");

      expect(message).toBe("Invalid URI encoding in test: undefined");
    });

    it("should format number values", () => {
      const message = formatErrorMessage(42, "test");

      expect(message).toBe("Invalid URI encoding in test: 42");
    });

    it("should format object values", () => {
      const obj = { code: "ERR_CODE" };
      const message = formatErrorMessage(obj, "test");

      expect(message).toBe("Invalid URI encoding in test: [object Object]");
    });
  });
});
