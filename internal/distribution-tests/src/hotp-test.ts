/**
 * Shared HOTP distribution test suite
 *
 * Tests the HOTP package using built artifacts (dist/).
 */

import {
  stringToBytes,
  createGuardrails,
  SecretTooLongError,
  CounterOverflowError,
  CounterToleranceTooLargeError,
} from "@otplib/core";
import { generate, generateSync, verify, verifySync } from "@otplib/hotp";
import { RFC4226_VECTORS, BASE_SECRET } from "@repo/testing";

import type { CryptoPlugin } from "@otplib/core";
import type { TestContext } from "@repo/testing";

/**
 * Creates the HOTP distribution test suite with injected dependencies
 */
export function createHOTPDistributionTests(ctx: TestContext<CryptoPlugin>): void {
  const { describe, it, expect, crypto } = ctx;
  const secret = stringToBytes(BASE_SECRET);

  describe("HOTP Distribution", () => {
    describe("RFC 4226 Appendix D - Test Vectors", () => {
      RFC4226_VECTORS.forEach(({ counter, expected }) => {
        it(`should generate RFC 4226 vector for counter ${counter}`, async () => {
          const result = await generate({
            secret,
            counter,
            algorithm: "sha1",
            digits: 6,
            crypto,
          });
          expect(result).toBe(expected);
        });
      });
    });

    describe("generate", () => {
      it("should generate consistent HOTP codes", async () => {
        const result1 = await generate({
          secret,
          counter: 0,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        const result2 = await generate({
          secret,
          counter: 0,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result1).toBe(result2);
      });

      it("should generate different codes for different counters", async () => {
        const result0 = await generate({
          secret,
          counter: 0,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        const result1 = await generate({
          secret,
          counter: 1,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result0).not.toBe(result1);
      });

      it("should support SHA256", async () => {
        const result = await generate({
          secret,
          counter: 0,
          algorithm: "sha256",
          digits: 6,
          crypto,
        });
        expect(result).toHaveLength(6);
        expect(result).toMatch(/^\d{6}$/);
      });

      it("should support SHA512", async () => {
        const result = await generate({
          secret,
          counter: 0,
          algorithm: "sha512",
          digits: 6,
          crypto,
        });
        expect(result).toHaveLength(6);
        expect(result).toMatch(/^\d{6}$/);
      });

      it("should generate 6, 7, and 8 digit codes", async () => {
        const result6 = await generate({ secret, counter: 0, digits: 6, crypto });
        const result7 = await generate({ secret, counter: 0, digits: 7, crypto });
        const result8 = await generate({ secret, counter: 0, digits: 8, crypto });
        expect(result6).toHaveLength(6);
        expect(result7).toHaveLength(7);
        expect(result8).toHaveLength(8);
      });
    });

    describe("verify", () => {
      it("should verify valid HOTP code", async () => {
        const token = await generate({
          secret,
          counter: 0,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          counter: 0,
          token,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.delta).toBe(0);
        }
      });

      it("should reject invalid HOTP code", async () => {
        const result = await verify({
          secret,
          counter: 0,
          token: "000000",
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result.valid).toBe(false);
      });

      it("should verify with window (look-ahead)", async () => {
        const token1 = await generate({
          secret,
          counter: 1,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          counter: 0,
          token: token1,
          algorithm: "sha1",
          digits: 6,
          crypto,
          counterTolerance: 1,
        });
        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.delta).toBe(1);
        }
      });
    });

    describe("Synchronous API", () => {
      it("should generate same code as async generate", async () => {
        const asyncResult = await generate({
          secret,
          counter: 0,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        const syncResult = generateSync({
          secret,
          counter: 0,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(syncResult).toBe(asyncResult);
      });

      it("should verify synchronously", () => {
        const token = generateSync({
          secret,
          counter: 0,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        const result = verifySync({
          secret,
          counter: 0,
          token,
          algorithm: "sha1",
          digits: 6,
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
            counter: 0,
            crypto,
            guardrails: restrictiveGuardrails,
          }),
        ).rejects.toThrow(SecretTooLongError);
      });

      it("should respect custom guardrails for counter validation", async () => {
        const restrictiveGuardrails = createGuardrails({
          MAX_COUNTER: 100,
        });

        await expect(
          generate({
            secret,
            counter: 101,
            crypto,
            guardrails: restrictiveGuardrails,
          }),
        ).rejects.toThrow(CounterOverflowError);
      });

      it("should respect custom guardrails for counterTolerance", async () => {
        const restrictiveGuardrails = createGuardrails({
          MAX_WINDOW: 5,
        });

        const token = await generate({ secret, counter: 0, crypto });

        await expect(
          verify({
            secret,
            counter: 0,
            token,
            crypto,
            counterTolerance: 10,
            guardrails: restrictiveGuardrails,
          }),
        ).rejects.toThrow(CounterToleranceTooLargeError);
      });
    });
  });
}
