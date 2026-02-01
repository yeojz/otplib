/**
 * Shared otplib distribution test suite
 *
 * Tests the main otplib package using built artifacts (dist/).
 */

import { TOTP } from "@otplib/totp";
import {
  generateSecret,
  generateURI,
  generate,
  generateSync,
  verify,
  verifySync,
  OTP,
} from "otplib";

import type { CryptoPlugin, Base32Plugin } from "@otplib/core";
import type { TestContext } from "@repo/testing";

export type OtplibDistributionTestContext = TestContext<CryptoPlugin, Base32Plugin> & {
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

const TEST_SECRET = "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337";

/**
 * Creates the otplib distribution test suite with injected dependencies
 */
export function createOtplibDistributionTests(ctx: OtplibDistributionTestContext): void {
  const { describe, it, expect, crypto, base32, otplib } = ctx;
  const { generateSecret, generateURI, generate, generateSync, verify, verifySync, TOTP, OTP } =
    otplib;

  describe("otplib Distribution", () => {
    describe("generateSecret", () => {
      it("should generate a Base32-encoded secret", () => {
        const secret = generateSecret();
        expect(secret).toMatch(/^[A-Z2-7]+$/);
      });

      it("should generate unique secrets", () => {
        const secret1 = generateSecret();
        const secret2 = generateSecret();
        expect(secret1).not.toBe(secret2);
      });

      it("should generate valid Base32 without padding", () => {
        const secret = generateSecret();
        expect(secret).not.toContain("=");
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

      it("should generate HOTP URI when strategy is hotp", () => {
        const uri = generateURI({
          strategy: "hotp",
          issuer: "ACME Co",
          label: "john@example.com",
          secret: TEST_SECRET,
          counter: 5,
        });

        expect(uri).toMatch(/^otpauth:\/\/hotp\//);
        expect(uri).toContain("counter=5");
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

      it("should be deterministic for same inputs", async () => {
        const token1 = await generate({ secret: TEST_SECRET, epoch: 1234567890 });
        const token2 = await generate({ secret: TEST_SECRET, epoch: 1234567890 });
        expect(token1).toBe(token2);
      });
    });

    describe("verify", () => {
      it("should verify correct TOTP code", async () => {
        const epoch = 1234567890;
        const token = await generate({ secret: TEST_SECRET, epoch });
        const result = await verify({ secret: TEST_SECRET, token, epoch });
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

      it("should throw error for invalid strategy", async () => {
        await expect(
          generate({ secret: TEST_SECRET, strategy: "invalid" as never }),
        ).rejects.toThrow("Unknown OTP strategy: invalid");
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
      it("should create instance with no arguments", () => {
        const otp = new OTP();
        expect(otp.getStrategy()).toBe("totp");
      });

      it("should work with HOTP strategy", async () => {
        const otp = new OTP({ strategy: "hotp" });
        expect(otp.getStrategy()).toBe("hotp");

        const secret = otp.generateSecret();
        const token = await otp.generate({ secret, counter: 0 });
        const result = await otp.verify({ secret, token, counter: 0 });

        expect(result.valid).toBe(true);
      });

      it("should work with TOTP strategy", async () => {
        const otp = new OTP({ strategy: "totp" });
        const secret = otp.generateSecret();
        const token = await otp.generate({ secret, epoch: 1234567890 });
        const result = await otp.verify({ secret, token, epoch: 1234567890 });

        expect(result.valid).toBe(true);
      });
    });

    describe("functional API HOTP strategy", () => {
      it("should generate and verify HOTP token", async () => {
        const token = await generate({
          secret: TEST_SECRET,
          strategy: "hotp",
          counter: 0,
        });

        expect(token).toHaveLength(6);

        const result = await verify({
          secret: TEST_SECRET,
          token,
          strategy: "hotp",
          counter: 0,
        });

        expect(result.valid).toBe(true);
      });
    });

    describe("synchronous API", () => {
      it("should generate and verify TOTP synchronously", () => {
        const epoch = 1234567890;
        const token = generateSync({ secret: TEST_SECRET, epoch });
        const result = verifySync({ secret: TEST_SECRET, token, epoch });
        expect(result.valid).toBe(true);
      });

      it("should generate and verify HOTP synchronously", () => {
        const token = generateSync({ secret: TEST_SECRET, strategy: "hotp", counter: 0 });
        const result = verifySync({ secret: TEST_SECRET, token, strategy: "hotp", counter: 0 });
        expect(result.valid).toBe(true);
      });
    });

    describe("integration tests", () => {
      it("should work end-to-end: generate secret, create URI, generate token, verify", async () => {
        const secret = generateSecret();
        const uri = generateURI({
          issuer: "TestService",
          label: "user@example.com",
          secret,
        });
        expect(uri).toMatch(/^otpauth:\/\/totp\//);

        const token = await generate({ secret });
        expect(token).toHaveLength(6);

        const result = await verify({ secret, token });
        expect(result.valid).toBe(true);
      });
    });
  });
}
