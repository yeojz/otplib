/**
 * Shared otplib test suite
 *
 * This file contains the test logic that can be run across different runtimes
 * by injecting the test framework (describe, it, expect) and crypto plugin.
 */

// Import actual function signatures using typeof
import { TOTP } from "@otplib/totp";

import { OTP } from "./class.ts";
import {
  generateSecret,
  generateURI,
  generate,
  generateSync,
  verify,
  verifySync,
} from "./functional.ts";

import type { CryptoPlugin, Base32Plugin } from "@otplib/core";
import type { TestContext } from "@repo/testing";

export type OtplibTestContext = TestContext<CryptoPlugin, Base32Plugin> & {
  otplib: {
    generateSecret: typeof generateSecret;
    generateURI: typeof generateURI;
    generate: typeof generate;
    generateSync: typeof generateSync;
    verify: typeof verify;
    verifySync: typeof verifySync;
    TOTP: typeof TOTP;
    OTP: typeof OTP;
  };
};

const TEST_SECRET = "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337"; // 20-byte Base32 secret

/**
 * Creates the otplib test suite with injected dependencies
 */
export function createOtplibTests(ctx: OtplibTestContext): void {
  const { describe, it, expect, crypto, base32, otplib } = ctx;
  const { generateSecret, generateURI, generate, generateSync, verify, verifySync, TOTP, OTP } =
    otplib;

  describe("otplib", () => {
    describe("generateSecret", () => {
      it("should generate a Base32-encoded secret", () => {
        const secret = generateSecret();
        expect(secret).toMatch(/^[A-Z2-7]+$/);
      });

      it("should generate secrets with proper entropy", () => {
        const secret1 = generateSecret();
        const secret2 = generateSecret();
        expect(secret1).not.toBe(secret2);
      });

      it("should support custom length", () => {
        const secret = generateSecret({ length: 16 });
        expect(secret.length).toBeGreaterThanOrEqual(20);
        expect(secret.length).toBeLessThanOrEqual(26);
      });

      it("should generate valid Base32 without padding", () => {
        const secret = generateSecret();
        expect(secret).not.toContain("=");
      });

      it("should use custom crypto if provided", () => {
        const secret = generateSecret({ crypto });
        expect(secret).toBeTruthy();
        expect(typeof secret).toBe("string");
      });
    });

    describe("generateURI", () => {
      it("should generate otpauth:// URI for TOTP", () => {
        const uri = generateURI({
          issuer: "ACME Co",
          label: "john@example.com",
          secret: TEST_SECRET,
        });

        expect(uri).toMatch(/^otpauth:\/\/totp\//);
        expect(uri).toContain("ACME%20Co:john%40example.com");
        expect(uri).toContain(`secret=${TEST_SECRET}`);
      });

      it("should include custom parameters", () => {
        const uri = generateURI({
          issuer: "GitHub",
          label: "user1",
          secret: TEST_SECRET,
          algorithm: "sha256",
          digits: 8,
          period: 60,
        });

        expect(uri).toContain("algorithm=SHA256");
        expect(uri).toContain("digits=8");
        expect(uri).toContain("period=60");
      });

      it("should include issuer in label", () => {
        const uri = generateURI({
          issuer: "TestService",
          label: "alice@test.com",
          secret: TEST_SECRET,
        });

        expect(uri).toContain("TestService:alice%40test.com");
        expect(uri).toContain("issuer=TestService");
      });

      it("should use default parameters when not specified", () => {
        const uri = generateURI({
          issuer: "Service",
          label: "user",
          secret: TEST_SECRET,
        });

        expect(uri).not.toContain("algorithm=");
        expect(uri).not.toContain("digits=");
        expect(uri).not.toContain("period=");
      });

      it("should properly encode special characters", () => {
        const uri = generateURI({
          issuer: "Test Co",
          label: "user+test@example.com",
          secret: TEST_SECRET,
        });

        expect(uri).toContain("user%2Btest%40example.com");
        expect(uri).toContain("Test%20Co");
      });

      it("should generate HOTP URI when strategy is hotp", () => {
        const uri = generateURI({
          strategy: "hotp",
          issuer: "ACME Co",
          label: "john@example.com",
          secret: TEST_SECRET,
          counter: 5,
        });

        expect(uri).toMatch(/^otpauth:\/\/hotp\//);
        expect(uri).toContain("ACME%20Co:john%40example.com");
        expect(uri).toContain(`secret=${TEST_SECRET}`);
        expect(uri).toContain("counter=5");
      });

      it("should validate bug report scenario: TOTP with strategy parameter", () => {
        // From GitHub issue #739 - user wanted to specify strategy
        // Our implementation uses 'strategy' not 'type'
        const uri = generateURI({
          strategy: "totp",
          issuer: "MyApp",
          label: "31@xx.com",
          secret: "243G2YOOEZWSZSIZOYNKCSIQ5HYUZRLX",
        });

        expect(uri).toMatch(/^otpauth:\/\/totp\//);
        expect(uri).toContain("MyApp:31%40xx.com");
        expect(uri).toContain("secret=243G2YOOEZWSZSIZOYNKCSIQ5HYUZRLX");
      });
    });

    describe("generate", () => {
      it("should generate 6-digit TOTP code from Base32 secret", async () => {
        const token = await generate({
          secret: TEST_SECRET,
          epoch: 1234567890,
          algorithm: "sha1",
          digits: 6,
          period: 30,
        });

        expect(token).toHaveLength(6);
        expect(token).toMatch(/^\d{6}$/);
      });

      it("should support SHA256", async () => {
        const token = await generate({
          secret: TEST_SECRET,
          epoch: 1234567890,
          algorithm: "sha256",
          digits: 6,
          period: 30,
        });

        expect(token).toHaveLength(6);
        expect(token).toMatch(/^\d{6}$/);
      });

      it("should support SHA512", async () => {
        const token = await generate({
          secret: TEST_SECRET,
          epoch: 1234567890,
          algorithm: "sha512",
          digits: 6,
          period: 30,
        });

        expect(token).toHaveLength(6);
        expect(token).toMatch(/^\d{6}$/);
      });

      it("should be deterministic for same inputs", async () => {
        const token1 = await generate({
          secret: TEST_SECRET,
          epoch: 1234567890,
        });

        const token2 = await generate({
          secret: TEST_SECRET,
          epoch: 1234567890,
        });

        expect(token1).toBe(token2);
      });
    });

    describe("verify", () => {
      it("should verify correct TOTP code", async () => {
        const epoch = 1234567890;

        const token = await generate({
          secret: TEST_SECRET,
          epoch,
        });

        const result = await verify({
          secret: TEST_SECRET,
          token,
          epoch,
        });

        expect(result.valid).toBe(true);
      });

      it("should reject incorrect TOTP code", async () => {
        const result = await verify({
          secret: TEST_SECRET,
          token: "000000",
          epoch: 1234567890,
        });

        expect(result.valid).toBe(false);
      });

      it("should verify with time window", async () => {
        // Generate token for previous period
        const tokenPast = await generate({
          secret: TEST_SECRET,
          epoch: 59,
        });

        // Should verify with tolerance 30 (1 period)
        const result = await verify({
          secret: TEST_SECRET,
          token: tokenPast,
          epoch: 60,
          epochTolerance: 30,
        });

        expect(result.valid).toBe(true);
      });

      it("should support afterTimeStep replay protection for TOTP", async () => {
        const token = await generate({
          secret: TEST_SECRET,
          epoch: 60, // time step 2
        });

        const allowed = await verify({
          secret: TEST_SECRET,
          token,
          epoch: 90, // current step 3
          epochTolerance: 30, // checks steps 2..4
          afterTimeStep: 1,
        });
        expect(allowed.valid).toBe(true);

        const blocked = await verify({
          secret: TEST_SECRET,
          token,
          epoch: 90,
          epochTolerance: 30,
          afterTimeStep: 2, // rejects step <= 2
        });
        expect(blocked.valid).toBe(false);
      });
    });

    describe("error handling", () => {
      it("should throw error when generate with HOTP strategy missing counter", async () => {
        await expect(generate({ secret: TEST_SECRET, strategy: "hotp" })).rejects.toThrow(
          "Counter is required for HOTP strategy",
        );
      });

      it("should throw error when verify with HOTP strategy missing counter", async () => {
        await expect(
          verify({ secret: TEST_SECRET, token: "123456", strategy: "hotp" }),
        ).rejects.toThrow("Counter is required for HOTP strategy");
      });

      it("should throw error for invalid strategy in generate", async () => {
        await expect(
          generate({ secret: TEST_SECRET, strategy: "invalid" as never }),
        ).rejects.toThrow("Unknown OTP strategy: invalid");
      });

      it("should throw error for invalid strategy in verify", async () => {
        await expect(
          verify({ secret: TEST_SECRET, token: "123456", strategy: "invalid" as never }),
        ).rejects.toThrow("Unknown OTP strategy: invalid");
      });

      it("should throw error when generateSync with HOTP strategy missing counter", () => {
        expect(() => generateSync({ secret: TEST_SECRET, strategy: "hotp" })).toThrow(
          "Counter is required for HOTP strategy",
        );
      });

      it("should throw error when verifySync with HOTP strategy missing counter", () => {
        expect(() =>
          verifySync({ secret: TEST_SECRET, token: "123456", strategy: "hotp" }),
        ).toThrow("Counter is required for HOTP strategy");
      });

      it("should throw error for invalid strategy in generateSync", () => {
        expect(() => generateSync({ secret: TEST_SECRET, strategy: "invalid" as never })).toThrow(
          "Unknown OTP strategy: invalid",
        );
      });

      it("should throw error for invalid strategy in verifySync", () => {
        expect(() =>
          verifySync({ secret: TEST_SECRET, token: "123456", strategy: "invalid" as never }),
        ).toThrow("Unknown OTP strategy: invalid");
      });
    });

    describe("integration tests", () => {
      it("should work end-to-end: generate secret, create URI, generate token, verify", async () => {
        // 1. Generate secret
        const secret = generateSecret();

        // 2. Create URI
        const uri = generateURI({
          issuer: "TestService",
          label: "user@example.com",
          secret,
        });
        expect(uri).toMatch(/^otpauth:\/\/totp\//);

        // 3. Generate token
        const token = await generate({ secret });
        expect(token).toHaveLength(6);

        // 4. Verify token
        const result = await verify({ secret, token });
        expect(result.valid).toBe(true);
      });
    });

    describe("TOTP class", () => {
      it("should generate and verify token with TOTP class", async () => {
        const totp = new TOTP({
          issuer: "TestService",
          label: "user@example.com",
          crypto,
          base32,
          secret: TEST_SECRET,
        });

        const token = await totp.generate();
        expect(token).toHaveLength(6);

        const result = await totp.verify(token);
        expect(result.valid).toBe(true);
      });

      it("should generate URI with TOTP class", () => {
        const totp = new TOTP({
          issuer: "TestService",
          label: "user@example.com",
          crypto,
          base32,
          secret: TEST_SECRET,
        });

        const uri = totp.toURI();
        expect(uri).toMatch(/^otpauth:\/\/totp\//);
      });
    });

    describe("OTP wrapper class", () => {
      it("should create instance with no arguments (testing default parameters)", () => {
        const otp = new OTP();
        expect(otp.getStrategy()).toBe("totp"); // default strategy
        expect(typeof otp.generateSecret).toBe("function");
        expect(typeof otp.generate).toBe("function");
        expect(typeof otp.verify).toBe("function");
      });

      it("should create instance with empty options (testing default parameters)", () => {
        const otp = new OTP({});
        expect(otp.getStrategy()).toBe("totp"); // default strategy
        expect(typeof otp.generateSecret).toBe("function");
        expect(typeof otp.generate).toBe("function");
        expect(typeof otp.verify).toBe("function");
      });

      it("should work with HOTP strategy", async () => {
        const otp = new OTP({ strategy: "hotp" });
        expect(otp.getStrategy()).toBe("hotp");

        const secret = otp.generateSecret();
        const token = await otp.generate({ secret, counter: 0 });
        const result = await otp.verify({ secret, token, counter: 0 });

        expect(result.valid).toBe(true);
      });

      it("should generate URI with HOTP strategy", () => {
        const otp = new OTP({ strategy: "hotp" });

        const uri = otp.generateURI({
          issuer: "ACME Co",
          label: "john@example.com",
          secret: TEST_SECRET,
          counter: 5,
        });

        expect(uri).toMatch(/^otpauth:\/\/hotp\//);
        expect(uri).toContain("counter=5");
        expect(uri).toContain("issuer=ACME%20Co");
      });

      it("should work with TOTP strategy", async () => {
        const otp = new OTP({ strategy: "totp" });
        expect(otp.getStrategy()).toBe("totp");

        const secret = otp.generateSecret();
        const token = await otp.generate({ secret, epoch: 1234567890 });
        const result = await otp.verify({ secret, token, epoch: 1234567890 });

        expect(result.valid).toBe(true);
      });

      it("should generate URI with TOTP strategy", () => {
        const otp = new OTP({ strategy: "totp" });
        const uri = otp.generateURI({
          issuer: "ACME Co",
          label: "john@example.com",
          secret: TEST_SECRET,
        });

        expect(uri).toMatch(/^otpauth:\/\/totp\//);
        expect(uri).toContain("ACME%20Co:john%40example.com");
        expect(uri).toContain(`secret=${TEST_SECRET}`);
      });
    });

    describe("functional API HOTP strategy", () => {
      it("should generate HOTP token with counter", async () => {
        const token = await generate({
          secret: TEST_SECRET,
          strategy: "hotp",
          counter: 0,
        });

        expect(token).toHaveLength(6);
        expect(token).toMatch(/^\d{6}$/);
      });

      it("should verify HOTP token with counter", async () => {
        const token = await generate({
          secret: TEST_SECRET,
          strategy: "hotp",
          counter: 0,
        });

        const result = await verify({
          secret: TEST_SECRET,
          token,
          strategy: "hotp",
          counter: 0,
        });

        expect(result.valid).toBe(true);
      });

      it("should generate HOTP token synchronously", () => {
        const token = generateSync({
          secret: TEST_SECRET,
          strategy: "hotp",
          counter: 0,
        });

        expect(token).toHaveLength(6);
        expect(token).toMatch(/^\d{6}$/);
      });

      it("should verify HOTP token synchronously", () => {
        const token = generateSync({
          secret: TEST_SECRET,
          strategy: "hotp",
          counter: 0,
        });

        const result = verifySync({
          secret: TEST_SECRET,
          token,
          strategy: "hotp",
          counter: 0,
        });

        expect(result.valid).toBe(true);
      });
    });

    describe("generateSync", () => {
      it("should generate 6-digit TOTP code synchronously", () => {
        const token = generateSync({
          secret: TEST_SECRET,
          epoch: 1234567890,
          algorithm: "sha1",
          digits: 6,
          period: 30,
        });

        expect(token).toHaveLength(6);
        expect(token).toMatch(/^\d{6}$/);
      });

      it("should throw error for invalid strategy", () => {
        expect(() => generateSync({ secret: TEST_SECRET, strategy: "invalid" as never })).toThrow(
          "Unknown OTP strategy: invalid",
        );
      });
    });

    describe("verifySync", () => {
      it("should verify correct TOTP code synchronously", () => {
        const epoch = 1234567890;

        const token = generateSync({
          secret: TEST_SECRET,
          epoch,
        });

        const result = verifySync({
          secret: TEST_SECRET,
          token,
          epoch,
        });

        expect(result.valid).toBe(true);
      });

      it("should verify with time window synchronously", () => {
        const tokenPast = generateSync({
          secret: TEST_SECRET,
          epoch: 59,
        });

        const result = verifySync({
          secret: TEST_SECRET,
          token: tokenPast,
          epoch: 60,
          epochTolerance: 30,
        });

        expect(result.valid).toBe(true);
      });

      it("should support afterTimeStep replay protection synchronously", () => {
        const token = generateSync({
          secret: TEST_SECRET,
          epoch: 60, // time step 2
        });

        const allowed = verifySync({
          secret: TEST_SECRET,
          token,
          epoch: 90, // step 3
          epochTolerance: 30,
          afterTimeStep: 1,
        });
        expect(allowed.valid).toBe(true);

        const blocked = verifySync({
          secret: TEST_SECRET,
          token,
          epoch: 90,
          epochTolerance: 30,
          afterTimeStep: 2,
        });
        expect(blocked.valid).toBe(false);
      });
    });

    describe("OTP class sync methods", () => {
      it("should generate and verify synchronously with TOTP strategy", () => {
        const otp = new OTP({ strategy: "totp" });

        const token = otp.generateSync({ secret: TEST_SECRET, epoch: 1234567890 });
        const result = otp.verifySync({ secret: TEST_SECRET, token, epoch: 1234567890 });

        expect(result.valid).toBe(true);
      });

      it("should generate and verify synchronously with HOTP strategy", () => {
        const otp = new OTP({ strategy: "hotp" });

        const token = otp.generateSync({ secret: TEST_SECRET, counter: 0 });
        const result = otp.verifySync({ secret: TEST_SECRET, token, counter: 0 });

        expect(result.valid).toBe(true);
      });
    });
  });
}
