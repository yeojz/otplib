/**
 * Shared TOTP distribution test suite
 *
 * Tests the TOTP package using built artifacts (dist/).
 */

import { stringToBytes, createGuardrails } from "@otplib/core";
import {
  generate,
  generateSync,
  verify,
  verifySync,
  getRemainingTime,
  getTimeStepUsed,
} from "@otplib/totp";
import { RFC6238_VECTORS, BASE_SECRET, hexToNumber } from "@repo/testing";

import type { CryptoPlugin, Base32Plugin } from "@otplib/core";
import type { TestContext } from "@repo/testing";

/**
 * Creates the TOTP distribution test suite with injected dependencies
 */
export function createTOTPDistributionTests(ctx: TestContext<CryptoPlugin, Base32Plugin>): void {
  const { describe, it, expect, crypto } = ctx;
  const secret = stringToBytes(BASE_SECRET);

  // Secrets with proper padding per RFC 6238
  const sha1Secret = stringToBytes(RFC6238_VECTORS.sha1.secret);
  const sha256Secret = stringToBytes(RFC6238_VECTORS.sha256.secret);
  const sha512Secret = stringToBytes(RFC6238_VECTORS.sha512.secret);

  describe("TOTP Distribution", () => {
    describe("RFC 6238 Appendix B - SHA1 Test Vectors", () => {
      RFC6238_VECTORS.sha1.vectors.forEach(({ epoch, expected }) => {
        it(`should generate RFC 6238 SHA1 vector for epoch ${epoch}`, async () => {
          const result = await generate({
            secret: sha1Secret,
            epoch,
            algorithm: "sha1",
            digits: 8,
            period: 30,
            crypto,
          });
          expect(result).toBe(expected);
        });
      });
    });

    describe("RFC 6238 Appendix B - SHA256 Test Vectors", () => {
      RFC6238_VECTORS.sha256.vectors.forEach(({ epoch, expected }) => {
        it(`should generate RFC 6238 SHA256 vector for epoch ${epoch}`, async () => {
          const result = await generate({
            secret: sha256Secret,
            epoch,
            algorithm: "sha256",
            digits: 8,
            period: 30,
            crypto,
          });
          expect(result).toBe(expected);
        });
      });
    });

    describe("RFC 6238 Appendix B - SHA512 Test Vectors", () => {
      RFC6238_VECTORS.sha512.vectors.forEach(({ epoch, expected }) => {
        it(`should generate RFC 6238 SHA512 vector for epoch ${epoch}`, async () => {
          const result = await generate({
            secret: sha512Secret,
            epoch,
            algorithm: "sha512",
            digits: 8,
            period: 30,
            crypto,
          });
          expect(result).toBe(expected);
        });
      });
    });

    describe("RFC 6238 Appendix B - Time Step Values", () => {
      RFC6238_VECTORS.sha1.vectors.forEach(({ epoch, t: expectedT }) => {
        it(`should compute correct time step T for epoch ${epoch}`, () => {
          const counter = getTimeStepUsed(epoch, 30, 0);
          const expectedCounter = hexToNumber(expectedT);
          expect(counter).toBe(expectedCounter);
        });
      });
    });

    describe("generate", () => {
      it("should generate consistent TOTP codes for same time", async () => {
        const epoch = 1234567890;
        const result1 = await generate({
          secret,
          epoch,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });
        const result2 = await generate({
          secret,
          epoch,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });
        expect(result1).toBe(result2);
      });

      it("should generate different codes for different times", async () => {
        const result1 = await generate({
          secret,
          epoch: 59,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });
        const result2 = await generate({
          secret,
          epoch: 60,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });
        expect(result1).not.toBe(result2);
      });

      it("should generate 6, 7, and 8 digit codes", async () => {
        const result6 = await generate({ secret, epoch: 59, digits: 6, period: 30, crypto });
        const result7 = await generate({ secret, epoch: 59, digits: 7, period: 30, crypto });
        const result8 = await generate({ secret, epoch: 59, digits: 8, period: 30, crypto });
        expect(result6).toHaveLength(6);
        expect(result7).toHaveLength(7);
        expect(result8).toHaveLength(8);
      });
    });

    describe("verify", () => {
      it("should verify valid TOTP code", async () => {
        const epoch = 59;
        const token = await generate({
          secret,
          epoch,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });

        const result = await verify({
          secret,
          token,
          epoch,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });
        expect(result.valid).toBe(true);
      });

      it("should reject invalid TOTP code", async () => {
        const result = await verify({
          secret,
          token: "00000000",
          epoch: 59,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });
        expect(result.valid).toBe(false);
      });

      it("should verify with tolerance window", async () => {
        const tokenPast = await generate({
          secret,
          epoch: 59,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });

        const result = await verify({
          secret,
          token: tokenPast,
          epoch: 60,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
          epochTolerance: 30,
        });
        expect(result.valid).toBe(true);
      });
    });

    describe("getRemainingTime", () => {
      it("should return remaining time in current period", () => {
        const remaining = getRemainingTime(59, 30);
        expect(remaining).toBe(1);
      });

      it("should return full period at start of period", () => {
        const remaining = getRemainingTime(30, 30);
        expect(remaining).toBe(30);
      });
    });

    describe("getTimeStepUsed", () => {
      it("should return correct counter for time", () => {
        const counter = getTimeStepUsed(59, 30);
        expect(counter).toBe(1);
      });

      it("should return 0 for first period", () => {
        const counter = getTimeStepUsed(29, 30);
        expect(counter).toBe(0);
      });
    });

    describe("Synchronous API", () => {
      it("should generate same code as async generate", async () => {
        const epoch = 59;
        const asyncResult = await generate({
          secret,
          epoch,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });
        const syncResult = generateSync({
          secret,
          epoch,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });
        expect(syncResult).toBe(asyncResult);
      });

      it("should verify synchronously", () => {
        const epoch = 59;
        const token = generateSync({
          secret,
          epoch,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });
        const result = verifySync({
          secret,
          token,
          epoch,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });
        expect(result.valid).toBe(true);
      });
    });

    describe("guardrails parameter", () => {
      it("should respect custom guardrails for secret validation", async () => {
        const restrictiveGuardrails = createGuardrails({
          MIN_SECRET_BYTES: 8,
          MAX_SECRET_BYTES: 10,
        });

        const longSecret = new Uint8Array(20);

        await expect(
          generate({
            secret: longSecret,
            epoch: 59,
            crypto,
            guardrails: restrictiveGuardrails,
          }),
        ).rejects.toThrow("Secret must not exceed");
      });

      it("should respect custom guardrails for period validation", async () => {
        const restrictiveGuardrails = createGuardrails({
          MAX_PERIOD: 60,
        });

        await expect(
          generate({
            secret,
            epoch: 59,
            period: 120,
            crypto,
            guardrails: restrictiveGuardrails,
          }),
        ).rejects.toThrow("Period must not exceed");
      });

      it("should respect custom guardrails for epochTolerance", async () => {
        const restrictiveGuardrails = createGuardrails({
          MAX_WINDOW: 5,
        });

        const token = await generate({ secret, epoch: 59, crypto });

        await expect(
          verify({
            secret,
            epoch: 59,
            token,
            period: 30,
            crypto,
            epochTolerance: 300,
            guardrails: restrictiveGuardrails,
          }),
        ).rejects.toThrow("Epoch tolerance must not exceed");
      });
    });

    describe("afterTimeStep (replay protection)", () => {
      it("should accept token when timeStep > afterTimeStep", async () => {
        const token = await generate({ secret, epoch: 60, period: 30, digits: 6, crypto });

        const result = await verify({
          secret,
          token,
          epoch: 60,
          period: 30,
          digits: 6,
          crypto,
          afterTimeStep: 1,
        });

        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.timeStep).toBe(2);
        }
      });

      it("should reject token when timeStep <= afterTimeStep", async () => {
        const token = await generate({ secret, epoch: 30, period: 30, digits: 6, crypto });

        const result = await verify({
          secret,
          token,
          epoch: 60,
          period: 30,
          digits: 6,
          crypto,
          afterTimeStep: 1,
        });

        expect(result.valid).toBe(false);
      });
    });
  });
}
