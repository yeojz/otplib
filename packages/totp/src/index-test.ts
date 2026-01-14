/**
 * Shared TOTP test suite
 *
 * This file contains the test logic that can be run across different runtimes
 * by injecting the test framework (describe, it, expect) and crypto plugin.
 */

import {
  stringToBytes,
  createGuardrails,
  SecretTooLongError,
  SecretTooShortError,
  PeriodTooLargeError,
  EpochToleranceTooLargeError,
} from "@otplib/core";
import { RFC6238_VECTORS, BASE_SECRET, hexToNumber } from "@repo/testing";

import {
  generate,
  generateSync,
  verify,
  verifySync,
  getRemainingTime,
  getTimeStepUsed,
} from "./index.ts";

import type { CryptoPlugin } from "@otplib/core";
import type { TestContext } from "@repo/testing";

/**
 * Creates the TOTP test suite with injected dependencies
 */
export function createTOTPTests(ctx: TestContext<CryptoPlugin>): void {
  const { describe, it, expect, crypto } = ctx;
  const secret = stringToBytes(BASE_SECRET);

  // Secrets with proper padding per RFC 6238
  const sha1Secret = stringToBytes(RFC6238_VECTORS.sha1.secret);
  const sha256Secret = stringToBytes(RFC6238_VECTORS.sha256.secret);
  const sha512Secret = stringToBytes(RFC6238_VECTORS.sha512.secret);

  describe("TOTP", () => {
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

    describe("RFC 6238 Appendix B - SHA256 Test Vectors (32-byte padded secret)", () => {
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

    describe("RFC 6238 Appendix B - SHA512 Test Vectors (64-byte padded secret)", () => {
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

    describe("Secret length verification", () => {
      it("should have correct SHA1 secret length (20 bytes)", () => {
        expect(sha1Secret.length).toBe(20);
      });

      it("should have correct SHA256 secret length (32 bytes)", () => {
        expect(sha256Secret.length).toBe(32);
      });

      it("should have correct SHA512 secret length (64 bytes)", () => {
        expect(sha512Secret.length).toBe(64);
      });
    });

    describe("RFC 6238 Appendix B - Intermediate T (Time Step) Values", () => {
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

      it("should use default epoch parameter (current time)", async () => {
        const result = await generate({
          secret,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });
        expect(result).toHaveLength(8);
        expect(result).toMatch(/^\d{8}$/);
      });

      it("should use default digits parameter (6)", async () => {
        const result = await generate({
          secret,
          epoch: 59,
          algorithm: "sha1",
          period: 30,
          crypto,
        });
        expect(result).toHaveLength(6);
        expect(result).toMatch(/^\d{6}$/);
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

      it("should generate 6-digit codes", async () => {
        const result = await generate({
          secret,
          epoch: 59,
          algorithm: "sha1",
          digits: 6,
          period: 30,
          crypto,
        });
        expect(result).toHaveLength(6);
        expect(result).toMatch(/^\d{6}$/);
      });

      it("should generate 7-digit codes", async () => {
        const result = await generate({
          secret,
          epoch: 59,
          algorithm: "sha1",
          digits: 7,
          period: 30,
          crypto,
        });
        expect(result).toHaveLength(7);
        expect(result).toMatch(/^\d{7}$/);
      });

      it("should generate 8-digit codes", async () => {
        const result = await generate({
          secret,
          epoch: 59,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });
        expect(result).toHaveLength(8);
        expect(result).toMatch(/^\d{8}$/);
      });

      it("should support SHA256", async () => {
        const result = await generate({
          secret,
          epoch: 59,
          algorithm: "sha256",
          digits: 8,
          period: 30,
          crypto,
        });
        expect(result).toHaveLength(8);
        expect(result).toMatch(/^\d{8}$/);
      });

      it("should support SHA512", async () => {
        const result = await generate({
          secret,
          epoch: 59,
          algorithm: "sha512",
          digits: 8,
          period: 30,
          crypto,
        });
        expect(result).toHaveLength(8);
        expect(result).toMatch(/^\d{8}$/);
      });

      it("should support different time periods", async () => {
        // At time 59 with period 30, counter should be 1
        const result1 = await generate({
          secret,
          epoch: 59,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });

        // At time 30 with period 30, counter should also be 1
        const result2 = await generate({
          secret,
          epoch: 30,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });

        expect(result1).toBe(result2);
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

      it("should use default epoch and digits parameters in verify", async () => {
        // Use fixed epoch for deterministic test
        const epoch = 59;

        const token = await generate({
          secret,
          epoch,
          period: 30,
          crypto,
        });

        // Verify with only required params (epoch, token) - should use defaults for algorithm and digits
        const result = await verify({
          secret,
          token,
          epoch,
          period: 30,
          crypto,
        });
        expect(result.valid).toBe(true);
      });

      it("should use default epoch parameter (current time) in verify", async () => {
        // Generate token using current time (default epoch)
        const token = await generate({
          secret,
          period: 30,
          crypto,
        });

        // Immediately verify using current time (default epoch)
        // This tests the default epoch parameter in getTOTPVerifyOptions
        const result = await verify({
          secret,
          token,
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

      it("should verify with window - past", async () => {
        // Generate token for previous period (time 59)
        const tokenPast = await generate({
          secret,
          epoch: 59,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });

        // Should verify with tolerance 30 (1 period)
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

      it("should verify with tolerance - future", async () => {
        const epoch = 59;

        // Generate token for current period
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
          epochTolerance: 0,
        });
        expect(result.valid).toBe(true);
      });

      it("should handle bidirectional window", async () => {
        // Generate token for counter 1 (time 30-59)
        const tokenPast = await generate({
          secret,
          epoch: 59,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });

        // Generate token for counter 3 (time 90-119)
        const tokenFuture = await generate({
          secret,
          epoch: 90,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });

        // Both should be valid with window 1
        const resultPast = await verify({
          secret,
          token: tokenPast,
          epoch: 60,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
          epochTolerance: 30,
        });

        const resultFuture = await verify({
          secret,
          token: tokenFuture,
          epoch: 60,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
          epochTolerance: 30,
        });

        expect(resultPast.valid).toBe(true);
        expect(resultFuture.valid).toBe(true);
      });

      it("should support larger windows", async () => {
        // Generate token for 2 periods ago
        const token = await generate({
          secret,
          epoch: 60,
          digits: 8,
          crypto,
        });

        // Should verify with window 2
        const result = await verify({
          secret,
          token,
          epoch: 120,
          epochTolerance: 60,
          digits: 8,
          crypto,
        });

        expect(result.valid).toBe(true);
      });

      it("should reject when token is outside window", async () => {
        // Generate token for far in the past
        const token = await generate({
          secret,
          epoch: 30,
          digits: 8,
          crypto,
        });

        // Should not verify with window 1
        const result = await verify({
          secret,
          token,
          epoch: 120,
          epochTolerance: 30,
          digits: 8,
          crypto,
        });

        expect(result.valid).toBe(false);
      });
    });

    describe("getRemainingTime", () => {
      it("should return remaining time in current period", () => {
        const remaining = getRemainingTime(59, 30);
        expect(remaining).toBe(1); // 30 - 59 % 30 = 30 - 29 = 1
      });

      it("should return full period at start of period", () => {
        const remaining = getRemainingTime(30, 30);
        expect(remaining).toBe(30);
      });

      it("should return 1 at end of period", () => {
        const remaining = getRemainingTime(89, 30);
        expect(remaining).toBe(1);
      });

      it("should support different periods", () => {
        const remaining = getRemainingTime(45, 60);
        expect(remaining).toBe(15); // 60 - 45 % 60 = 60 - 45 = 15
      });

      it("should use default time parameter (now)", () => {
        const remaining = getRemainingTime();
        expect(remaining).toBeGreaterThan(0);
        expect(remaining).toBeLessThanOrEqual(30);
      });

      it("should use default period parameter (30 seconds)", () => {
        const remaining = getRemainingTime(59);
        expect(remaining).toBe(1);
      });

      it("should use both default parameters", () => {
        const remaining = getRemainingTime();
        expect(remaining).toBeGreaterThan(0);
        expect(remaining).toBeLessThanOrEqual(30);
      });
    });

    describe("getTimeStepUsed", () => {
      it("should return correct counter for time", () => {
        const counter = getTimeStepUsed(59, 30);
        expect(counter).toBe(1); // Math.floor(59 / 30) = 1
      });

      it("should return 0 for first period", () => {
        const counter = getTimeStepUsed(29, 30);
        expect(counter).toBe(0);
      });

      it("should return correct counter for larger times", () => {
        const counter = getTimeStepUsed(1234567890, 30);
        expect(counter).toBe(41152263); // Math.floor(1234567890 / 30)
      });

      it("should support different periods", () => {
        const counter = getTimeStepUsed(90, 60);
        expect(counter).toBe(1); // Math.floor(90 / 60) = 1
      });

      it("should use default time parameter (now)", () => {
        const counter = getTimeStepUsed();
        expect(typeof counter).toBe("number");
        expect(counter).toBeGreaterThanOrEqual(0);
      });

      it("should use default period parameter (30 seconds)", () => {
        const counter = getTimeStepUsed(59);
        expect(counter).toBe(1);
      });

      it("should use both default parameters", () => {
        const counter = getTimeStepUsed();
        expect(typeof counter).toBe("number");
        expect(counter).toBeGreaterThanOrEqual(0);
      });
    });

    describe("edge cases", () => {
      it("should handle time 0", async () => {
        const result = await generate({
          secret,
          epoch: 0,
          algorithm: "sha1",
          digits: 6,
          period: 30,
          crypto,
        });
        expect(result).toHaveLength(6);
        expect(result).toMatch(/^\d{6}$/);
      });

      it("should handle very large time values", async () => {
        const result = await generate({
          secret,
          epoch: 20000000000,
          algorithm: "sha1",
          digits: 8,
          period: 30,
          crypto,
        });
        expect(result).toHaveLength(8);
        expect(result).toMatch(/^\d{8}$/);
      });

      it("should handle minimum period (1 second)", async () => {
        const result = await generate({
          secret,
          epoch: 5,
          algorithm: "sha1",
          digits: 6,
          period: 1,
          crypto,
        });
        expect(result).toHaveLength(6);
        expect(result).toMatch(/^\d{6}$/);

        // Verify different seconds produce different codes
        const result2 = await generate({
          secret,
          epoch: 6,
          algorithm: "sha1",
          digits: 6,
          period: 1,
          crypto,
        });
        expect(result).not.toBe(result2);
      });

      it("should handle maximum period (3600 seconds / 1 hour)", async () => {
        const result = await generate({
          secret,
          epoch: 3600,
          algorithm: "sha1",
          digits: 6,
          period: 3600,
          crypto,
        });
        expect(result).toHaveLength(6);
        expect(result).toMatch(/^\d{6}$/);

        // Same code for entire hour
        const result2 = await generate({
          secret,
          epoch: 7199, // Last second of second hour
          algorithm: "sha1",
          digits: 6,
          period: 3600,
          crypto,
        });
        expect(result).toBe(result2);
      });

      it("should handle time exactly at period boundary", async () => {
        // Time exactly at boundary (30 seconds)
        const atBoundary = await generate({
          secret,
          epoch: 30,
          algorithm: "sha1",
          digits: 6,
          period: 30,
          crypto,
        });

        // Time just before boundary (29 seconds)
        const beforeBoundary = await generate({
          secret,
          epoch: 29,
          algorithm: "sha1",
          digits: 6,
          period: 30,
          crypto,
        });

        // Time just after boundary (31 seconds)
        const afterBoundary = await generate({
          secret,
          epoch: 31,
          algorithm: "sha1",
          digits: 6,
          period: 30,
          crypto,
        });

        // Before and at boundary should be different (different time steps)
        expect(beforeBoundary).not.toBe(atBoundary);
        // At and after boundary should be the same (same time step)
        expect(atBoundary).toBe(afterBoundary);
      });

      it("should verify token at period boundary with window", async () => {
        // Generate token for time step 0 (0-29 seconds)
        const token = await generate({
          secret,
          epoch: 29,
          algorithm: "sha1",
          digits: 6,
          period: 30,
          crypto,
        });

        // Verify at exactly the boundary (30 seconds = time step 1)
        // Should succeed with window=1 because it looks back
        const result = await verify({
          secret,
          token,
          epoch: 30,
          algorithm: "sha1",
          digits: 6,
          period: 30,
          crypto,
          epochTolerance: 30,
        });
        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.delta).toBe(-1);
        }
      });

      it("should handle window that extends into negative counters", async () => {
        // At epoch 10 with period 30, counter is 0
        // With window 1, offsets are [-1, 0, 1]
        // Offset -1 would give counter -1, which should be skipped
        const token = await generate({
          secret,
          epoch: 10,
          algorithm: "sha1",
          digits: 6,
          period: 30,
          crypto,
        });

        // Verify with window - should succeed by checking counter 0
        const result = await verify({
          secret,
          token,
          epoch: 10,
          algorithm: "sha1",
          digits: 6,
          period: 30,
          crypto,
          epochTolerance: 30,
        });
        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.delta).toBe(0);
        }
      });

      it("should handle t0 offset correctly", async () => {
        // With t0=10, time 40 should be in the same step as time 30 with t0=0
        const withT0 = await generate({
          secret,
          epoch: 40,
          t0: 10,
          algorithm: "sha1",
          digits: 6,
          period: 30,
          crypto,
        });

        const withoutT0 = await generate({
          secret,
          epoch: 30,
          t0: 0,
          algorithm: "sha1",
          digits: 6,
          period: 30,
          crypto,
        });

        expect(withT0).toBe(withoutT0);
      });
    });

    describe("t0 parameter variations", () => {
      it("should calculate correct counter with non-zero t0", async () => {
        // counter = floor((epoch - t0) / period)
        // With epoch=100, t0=40, period=30: counter = floor((100-40)/30) = floor(60/30) = 2
        const result1 = await generate({
          secret,
          epoch: 100,
          t0: 40,
          period: 30,
          digits: 6,
          crypto,
        });

        // This should equal epoch=60, t0=0 (counter = floor(60/30) = 2)
        const result2 = await generate({
          secret,
          epoch: 60,
          t0: 0,
          period: 30,
          digits: 6,
          crypto,
        });

        expect(result1).toBe(result2);
      });

      it("should handle large t0 values", async () => {
        // Starting from Unix epoch of 2020-01-01 (1577836800)
        const t0 = 1577836800;
        const epoch = t0 + 90; // 3 periods after t0

        const result = await generate({
          secret,
          epoch,
          t0,
          period: 30,
          digits: 6,
          crypto,
        });

        // Should equal epoch=90, t0=0 (counter = floor(90/30) = 3)
        const expected = await generate({
          secret,
          epoch: 90,
          t0: 0,
          period: 30,
          digits: 6,
          crypto,
        });

        expect(result).toBe(expected);
      });

      it("should verify tokens correctly with t0 offset", async () => {
        const t0 = 100;
        const epoch = 160; // counter = floor((160-100)/30) = 2

        const token = await generate({
          secret,
          epoch,
          t0,
          period: 30,
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          token,
          epoch,
          t0,
          period: 30,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.delta).toBe(0);
        }
      });

      it("should handle t0 at period boundary", async () => {
        // t0 = 30 (exactly one period)
        // epoch = 60, counter = floor((60-30)/30) = 1
        const withT0 = await generate({
          secret,
          epoch: 60,
          t0: 30,
          period: 30,
          digits: 6,
          crypto,
        });

        // Should equal counter 1 with t0=0
        const withoutT0 = await generate({
          secret,
          epoch: 30, // counter = floor(30/30) = 1
          t0: 0,
          period: 30,
          digits: 6,
          crypto,
        });

        expect(withT0).toBe(withoutT0);
      });

      it("should generate different codes for different t0 values with same epoch", async () => {
        const epoch = 100;

        const result1 = await generate({
          secret,
          epoch,
          t0: 0,
          period: 30,
          digits: 6,
          crypto,
        });

        const result2 = await generate({
          secret,
          epoch,
          t0: 10, // Different t0 shifts the counter
          period: 30,
          digits: 6,
          crypto,
        });

        // counter1 = floor(100/30) = 3
        // counter2 = floor((100-10)/30) = floor(90/30) = 3
        // Both have counter 3, so they should be equal
        expect(result1).toBe(result2);

        // But with t0=40, counter = floor((100-40)/30) = 2
        const result3 = await generate({
          secret,
          epoch,
          t0: 40,
          period: 30,
          digits: 6,
          crypto,
        });

        expect(result1).not.toBe(result3);
      });

      it("should handle getRemainingTime with t0", () => {
        // time=100, period=30, t0=10
        // counter = floor((100-10)/30) = 3
        // next counter time = 3*30 + 30 + 10 = 130
        // remaining = 130 - 100 = 30... but that's wrong
        // Actually: counter = floor((100-10)/30) = 3
        // nextTime = (counter + 1) * period + t0 = 4 * 30 + 10 = 130
        // remaining = 130 - 100 = 30? No wait...
        // At time 100, t0=10: effective time = 100 - 10 = 90
        // 90 % 30 = 0, so we're at a boundary
        // remaining should be 30

        const remaining = getRemainingTime(100, 30, 10);
        expect(remaining).toBe(30); // At boundary, full period remains
      });

      it("should handle getTimeStepUsed with t0", () => {
        // counter = floor((time - t0) / period)
        const counter = getTimeStepUsed(100, 30, 10);
        // counter = floor((100 - 10) / 30) = floor(90/30) = 3
        expect(counter).toBe(3);
      });

      it("should verify with window when using t0", async () => {
        const t0 = 100;
        const period = 30;

        // Generate token at counter 2 (epoch = 100 + 60 = 160, counter = floor(60/30) = 2)
        const tokenCounter2 = await generate({
          secret,
          epoch: 160,
          t0,
          period,
          digits: 6,
          crypto,
        });

        // Verify at counter 3 (epoch = 100 + 90 = 190) with window=1
        // Should match since counter 2 is within window [-1, 0, 1] of counter 3
        const result = await verify({
          secret,
          token: tokenCounter2,
          epoch: 190,
          t0,
          period,
          digits: 6,
          crypto,
          epochTolerance: 30,
        });

        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.delta).toBe(-1);
        }
      });

      it("should handle epoch equal to t0 (counter = 0)", async () => {
        const t0 = 1000;

        const result = await generate({
          secret,
          epoch: t0, // Same as t0, so counter = 0
          t0,
          period: 30,
          digits: 6,
          crypto,
        });

        // Should equal counter 0 with t0=0
        const expected = await generate({
          secret,
          epoch: 0,
          t0: 0,
          period: 30,
          digits: 6,
          crypto,
        });

        expect(result).toBe(expected);
      });

      it("should reject epoch less than t0 (negative counter)", async () => {
        // This tests when epoch < t0, which results in negative counter
        // The implementation correctly rejects negative counters
        const t0 = 1000;
        const epoch = 990; // 10 seconds before t0

        // counter = floor((990 - 1000) / 30) = floor(-10/30) = -1
        // Should throw CounterNegativeError
        await expect(
          generate({
            secret,
            epoch,
            t0,
            period: 30,
            digits: 6,
            crypto,
          }),
        ).rejects.toThrow("Counter must be non-negative");
      });
    });

    describe("tolerance option (time-based verification)", () => {
      it("should accept current period token with epochTolerance: 0", async () => {
        const epoch = 1000; // Middle of a period
        const token = await generate({ secret, epoch, period: 30, digits: 6, crypto });

        const result = await verify({
          secret,
          token,
          epoch,
          epochTolerance: 0,
          period: 30,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.delta).toBe(0);
        }
      });

      it("should reject previous period token with epochTolerance: 0", async () => {
        const epoch = 1000;
        const previousPeriodEpoch = epoch - 30; // Previous period
        const token = await generate({
          secret,
          epoch: previousPeriodEpoch,
          period: 30,
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          token,
          epoch,
          epochTolerance: 0,
          period: 30,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(false);
      });

      it("should accept previous period token when within tolerance at period start", async () => {
        // At second 3 of current period, with tolerance 5, previous token should be valid
        const period = 30;
        const currentPeriodStart = 990; // Period starts at 990
        const epoch = currentPeriodStart + 3; // 3 seconds into period

        const previousToken = await generate({
          secret,
          epoch: currentPeriodStart - period, // Previous period
          period,
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          token: previousToken,
          epoch,
          epochTolerance: 5,
          period,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.delta).toBe(-1);
        }
      });

      it("should reject previous period token when outside tolerance", async () => {
        // At second 10 of current period, with tolerance 5, previous token should NOT be valid
        const period = 30;
        const currentPeriodStart = 990;
        const epoch = currentPeriodStart + 10; // 10 seconds into period

        const previousToken = await generate({
          secret,
          epoch: currentPeriodStart - period,
          period,
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          token: previousToken,
          epoch,
          epochTolerance: 5,
          period,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(false);
      });

      it("should accept next period token when within tolerance at period end", async () => {
        // At second 27 of current period (3 seconds before end), with tolerance 5, next token should be valid
        const period = 30;
        const currentPeriodStart = 990;
        const epoch = currentPeriodStart + 27; // 27 seconds into period (3 before end)

        const nextToken = await generate({
          secret,
          epoch: currentPeriodStart + period, // Next period
          period,
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          token: nextToken,
          epoch,
          epochTolerance: 5,
          period,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.delta).toBe(1);
        }
      });

      it("should reject next period token when outside tolerance", async () => {
        // At second 20 of current period (10 seconds before end), with tolerance 5, next token should NOT be valid
        const period = 30;
        const currentPeriodStart = 990;
        const epoch = currentPeriodStart + 20; // 20 seconds into period

        const nextToken = await generate({
          secret,
          epoch: currentPeriodStart + period,
          period,
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          token: nextToken,
          epoch,
          epochTolerance: 5,
          period,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(false);
      });

      it("should reject next period token when exactly 6 seconds outside 5s tolerance", async () => {
        // Epoch 24. Tolerance 5. Window [19, 29].
        // Token from epoch 30 (next period) is 6 seconds in the future, should be rejected
        // Current counter: floor(24/30) = 0
        // Token counter: floor(30/30) = 1
        // Window [19, 29] covers: floor(19/30)=0 to floor(29/30)=0 → only counter 0
        // Token from counter 1 is outside tolerance window
        const period = 30;
        const epoch = 24;

        const tokenTime30 = await generate({
          secret,
          epoch: 30, // 6 seconds in the future (next period)
          period,
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          token: tokenTime30,
          epoch,
          epochTolerance: 5,
          period,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(false);
      });

      it("should accept next period token when exactly at 5s tolerance boundary", async () => {
        // Epoch 25. Tolerance 5. Window [20, 30].
        // Token from epoch 30 is exactly 5 seconds in the future, should be accepted (inclusive)
        const period = 30;
        const epoch = 25; // 5 seconds before period boundary at 30

        const tokenTime30 = await generate({
          secret,
          epoch: 30, // Exactly 5 seconds in the future
          period,
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          token: tokenTime30,
          epoch,
          epochTolerance: 5,
          period,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.delta).toBe(1);
        }
      });

      it("should reject when tolerance window strictly excludes previous period", async () => {
        // Epoch 35. Tolerance 5. Window [30, 40].
        // 30 is start of C1. 40 is in C1.
        // Allowed: C1 only. (floor(30/30)=1, floor(40/30)=1)
        const period = 30;
        const currentPeriodStart = 30;
        const epoch = currentPeriodStart + 5; // 35

        // Token from Time 29 is C0.
        // Diff is 6s (35 - 29).
        const tokenTime29 = await generate({
          secret,
          epoch: 29,
          period,
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          token: tokenTime29,
          epoch,
          epochTolerance: 5,
          period,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(false);
      });

      it("should accept previous period token when exactly at 5s tolerance boundary", async () => {
        // Epoch 35. Tolerance 5. Window [30, 40].
        // Token from epoch 30 is exactly 5 seconds in the past, should be accepted (inclusive)
        const period = 30;
        const currentPeriodStart = 30;
        const epoch = currentPeriodStart + 5; // 35

        const tokenTime30 = await generate({
          secret,
          epoch: 30, // Exactly 5 seconds in the past
          period,
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          token: tokenTime30,
          epoch,
          epochTolerance: 5,
          period,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.delta).toBe(0);
        }
      });

      it("should accept tokens within full period tolerance", async () => {
        const period = 30;
        const epoch = 1000;

        // With tolerance = 30 (full period), should accept current and adjacent periods
        const currentToken = await generate({ secret, epoch, period, digits: 6, crypto });
        const previousToken = await generate({
          secret,
          epoch: epoch - period,
          period,
          digits: 6,
          crypto,
        });
        const nextToken = await generate({
          secret,
          epoch: epoch + period,
          period,
          digits: 6,
          crypto,
        });

        const currentResult = await verify({
          secret,
          token: currentToken,
          epoch,
          epochTolerance: 30,
          period,
          digits: 6,
          crypto,
        });
        expect(currentResult.valid).toBe(true);

        const previousResult = await verify({
          secret,
          token: previousToken,
          epoch,
          epochTolerance: 30,
          period,
          digits: 6,
          crypto,
        });
        expect(previousResult.valid).toBe(true);

        const nextResult = await verify({
          secret,
          token: nextToken,
          epoch,
          epochTolerance: 30,
          period,
          digits: 6,
          crypto,
        });
        expect(nextResult.valid).toBe(true);
      });

      it("should throw error for negative tolerance", async () => {
        const epoch = 1000;
        const token = await generate({ secret, epoch, period: 30, digits: 6, crypto });

        await expect(
          verify({
            secret,
            token,
            epoch,
            epochTolerance: -5,
            period: 30,
            digits: 6,
            crypto,
          }),
        ).rejects.toThrow("Epoch tolerance cannot contain negative values");
      });

      it("should throw error for negative tolerance in tuple", async () => {
        const epoch = 1000;
        const token = await generate({ secret, epoch, period: 30, digits: 6, crypto });

        await expect(
          verify({
            secret,
            token,
            epoch,
            epochTolerance: [5, -1],
            period: 30,
            digits: 6,
            crypto,
          }),
        ).rejects.toThrow("Epoch tolerance cannot contain negative values");
      });

      it("should handle asymmetric tolerance [past, 0] (RFC-compliant)", async () => {
        const period = 30;
        const currentPeriodStart = 990;
        const epoch = currentPeriodStart + 3; // 3 seconds into current period

        const previousToken = await generate({
          secret,
          epoch: currentPeriodStart - period,
          period,
          digits: 6,
          crypto,
        });

        const nextToken = await generate({
          secret,
          epoch: currentPeriodStart + period,
          period,
          digits: 6,
          crypto,
        });

        // With [5, 0], should accept previous period token (3 sec from boundary)
        const previousResult = await verify({
          secret,
          token: previousToken,
          epoch,
          epochTolerance: [5, 0],
          period,
          digits: 6,
          crypto,
        });
        expect(previousResult.valid).toBe(true);

        // With [5, 0], should NOT accept future period token
        const nextResult = await verify({
          secret,
          token: nextToken,
          epoch,
          epochTolerance: [5, 0],
          period,
          digits: 6,
          crypto,
        });
        expect(nextResult.valid).toBe(false);
      });

      it("should handle asymmetric tolerance [0, future]", async () => {
        const period = 30;
        const currentPeriodStart = 990;
        const epoch = currentPeriodStart + 27; // 27 seconds into current period (3 sec from end)

        const previousToken = await generate({
          secret,
          epoch: currentPeriodStart - period,
          period,
          digits: 6,
          crypto,
        });

        const nextToken = await generate({
          secret,
          epoch: currentPeriodStart + period,
          period,
          digits: 6,
          crypto,
        });

        // With [0, 5], should NOT accept previous period token
        const previousResult = await verify({
          secret,
          token: previousToken,
          epoch,
          epochTolerance: [0, 5],
          period,
          digits: 6,
          crypto,
        });
        expect(previousResult.valid).toBe(false);

        // With [0, 5], should accept future period token (3 sec from boundary)
        const nextResult = await verify({
          secret,
          token: nextToken,
          epoch,
          epochTolerance: [0, 5],
          period,
          digits: 6,
          crypto,
        });
        expect(nextResult.valid).toBe(true);
      });

      it("should reject when array tolerance [past, future] strictly excludes previous period", async () => {
        // Look-behind Failure Case
        // Epoch 35. Tolerance [5, 0]. Window [30, 35].
        // 30 is start of C1. 35 is in C1.
        // Allowed: C1 only. (floor(30/30)=1, floor(35/30)=1)

        // Token from Time 29 is C0.
        // Diff is 6s (35 - 29).
        const period = 30;
        const currentPeriodStart = 30;
        const epoch = currentPeriodStart + 5; // 35
        const tokenTime29 = await generate({ secret, epoch: 29, period, digits: 6, crypto });

        const result = await verify({
          secret,
          token: tokenTime29,
          epoch,
          epochTolerance: [5, 0],
          period,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(false);
      });

      it("should reject when array tolerance [past, future] strictly excludes future period", async () => {
        // Look-ahead Failure Case
        // Epoch 25. Tolerance [0, 4]. Window [25, 29].
        // 25 is in C0. 29 is in C0.
        // Allowed: C0 only. (floor(25/30)=0, floor(29/30)=0)

        // Token from Time 30 is C1.
        // Diff is 5s (30 - 25).
        const period = 30;
        const epoch = 25; // 5s before end of C0

        const tokenTime30 = await generate({ secret, epoch: 30, period, digits: 6, crypto });

        const result = await verify({
          secret,
          token: tokenTime30,
          epoch,
          epochTolerance: [0, 4],
          period,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(false);
      });

      it("should handle tolerance with t0 offset", async () => {
        const t0 = 100;
        const period = 30;
        const epoch = 130 + 3; // 3 seconds into period starting at 130 (counter 1)

        // Previous period (counter 0) starts at t0=100, ends at 130
        const previousToken = await generate({
          secret,
          epoch: t0, // Previous period start (counter 0)
          t0,
          period,
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          token: previousToken,
          epoch,
          t0,
          epochTolerance: 5,
          period,
          digits: 6,
          crypto,
        });

        expect(result.valid).toBe(true);
      });

      it("should demonstrate security with stricter tolerance", async () => {
        // This test demonstrates how stricter tolerance improves security
        // With epochTolerance: 30 (1 period), a previous token is valid for the ENTIRE current period
        // With epochTolerance: 5, a previous token is only valid for 5 seconds into the new period

        const period = 30;
        const currentPeriodStart = 990;

        // Generate token from previous period
        const previousToken = await generate({
          secret,
          epoch: currentPeriodStart - period,
          period,
          digits: 6,
          crypto,
        });

        // At 25 seconds into current period:
        const epochLate = currentPeriodStart + 25;

        // With epochTolerance: 30, previous token is STILL valid (less secure)
        const lenientResult = await verify({
          secret,
          token: previousToken,
          epoch: epochLate,
          epochTolerance: 30,
          period,
          digits: 6,
          crypto,
        });
        expect(lenientResult.valid).toBe(true); // Token from 55 seconds ago still valid!

        // With epochTolerance: 5, previous token is NOT valid (more secure)
        const strictResult = await verify({
          secret,
          token: previousToken,
          epoch: epochLate,
          epochTolerance: 5,
          period,
          digits: 6,
          crypto,
        });
        expect(strictResult.valid).toBe(false); // Correctly rejected
      });

      it("should accept tokens from same period even if generated outside tolerance window (TOTP limitation)", async () => {
        // IMPORTANT: This test documents a fundamental TOTP limitation.
        //
        // TOTP tokens encode only the counter (period), not the exact generation time.
        // Therefore, if ANY part of a period overlaps with the tolerance window,
        // ALL tokens from that period are accepted, even if they were generated
        // outside the tolerance window.
        //
        // Example: Server at epoch 60, tolerance 5, period 30
        // - Window: [55, 65]
        // - Counter 1 spans [30, 60), overlaps at [55, 60)
        // - Token from epoch 59: 1s away → ACCEPT (expected)
        // - Token from epoch 54: 6s away → ACCEPT (TOTP limitation!)
        //
        // Both produce the same token (counter 1), so both are accepted.
        // Worst case: with tolerance T and period P, tokens up to T + (P-1) seconds
        // old can be accepted (5 + 29 = 34 seconds in this example).

        const period = 30;
        const serverEpoch = 60; // Start of counter 2
        const tolerance = 5;

        // Token from epoch 59: 1 second before server (should accept)
        const token59 = await generate({
          secret,
          epoch: 59,
          period,
          digits: 6,
          crypto,
        });

        // Token from epoch 54: 6 seconds before server (outside 5s tolerance, but same counter!)
        const token54 = await generate({
          secret,
          epoch: 54,
          period,
          digits: 6,
          crypto,
        });

        // Both are from counter 1: floor(59/30) = floor(54/30) = 1
        expect(Math.floor(59 / period)).toBe(Math.floor(54 / period));

        // Therefore, both produce the same token
        expect(token59).toBe(token54);

        // Verify at server time 60 with 5s tolerance
        const result59 = await verify({
          secret,
          token: token59,
          epoch: serverEpoch,
          epochTolerance: tolerance,
          period,
          digits: 6,
          crypto,
        });

        const result54 = await verify({
          secret,
          token: token54,
          epoch: serverEpoch,
          epochTolerance: tolerance,
          period,
          digits: 6,
          crypto,
        });

        // Both accepted because counter 1 overlaps with window [55, 65]
        expect(result59.valid).toBe(true);
        expect(result54.valid).toBe(true);

        // Note: This is a fundamental limitation of TOTP, not a bug.
        // Tokens represent time periods, not instants.
        // epochTolerance means "periods that overlap with [epoch±tolerance]",
        // not "tokens generated within ±tolerance seconds".
      });
    });

    describe("Synchronous API", () => {
      describe("generateSync", () => {
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

        RFC6238_VECTORS.sha1.vectors.forEach(({ epoch, expected }) => {
          it(`should generate RFC 6238 SHA1 vector for epoch ${epoch} synchronously`, () => {
            const result = generateSync({
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

        it("should support all digit lengths", () => {
          const result6 = generateSync({ secret, epoch: 59, digits: 6, period: 30, crypto });
          const result7 = generateSync({ secret, epoch: 59, digits: 7, period: 30, crypto });
          const result8 = generateSync({ secret, epoch: 59, digits: 8, period: 30, crypto });
          expect(result6).toHaveLength(6);
          expect(result7).toHaveLength(7);
          expect(result8).toHaveLength(8);
        });
      });

      describe("verifySync", () => {
        it("should verify valid code synchronously", () => {
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
          if (result.valid) {
            expect(result.delta).toBe(0);
          }
        });

        it("should reject invalid code synchronously", () => {
          const result = verifySync({
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

        it("should respect epochTolerance", () => {
          const tokenPast = generateSync({
            secret,
            epoch: 59,
            algorithm: "sha1",
            digits: 8,
            period: 30,
            crypto,
          });
          const result = verifySync({
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
    });

    describe("guardrails parameter pass-through", () => {
      describe("generate", () => {
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
          ).rejects.toThrow(SecretTooLongError);
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
          ).rejects.toThrow(PeriodTooLargeError);
        });

        it("should pass guardrails to underlying HOTP generation", async () => {
          const lenientGuardrails = createGuardrails({
            MIN_SECRET_BYTES: 1,
          });

          const shortSecret = new Uint8Array(5);

          const result = await generate({
            secret: shortSecret,
            epoch: 59,
            crypto,
            guardrails: lenientGuardrails,
          });

          expect(result).toMatch(/^\d{6}$/);
        });

        it("should fail if guardrails not passed to HOTP (would use defaults)", async () => {
          const lenientGuardrails = createGuardrails({
            MIN_SECRET_BYTES: 1,
          });

          const shortSecret = new Uint8Array(5);

          const resultWithGuardrails = await generate({
            secret: shortSecret,
            epoch: 59,
            crypto,
            guardrails: lenientGuardrails,
          });

          expect(resultWithGuardrails).toMatch(/^\d{6}$/);

          await expect(
            generate({
              secret: shortSecret,
              epoch: 59,
              crypto,
            }),
          ).rejects.toThrow(SecretTooShortError);
        });
      });

      describe("generateSync", () => {
        it("should respect custom guardrails for secret validation", () => {
          const restrictiveGuardrails = createGuardrails({
            MIN_SECRET_BYTES: 8,
            MAX_SECRET_BYTES: 10,
          });

          const longSecret = new Uint8Array(20);

          expect(() =>
            generateSync({
              secret: longSecret,
              epoch: 59,
              crypto,
              guardrails: restrictiveGuardrails,
            }),
          ).toThrow(SecretTooLongError);
        });

        it("should respect custom guardrails for period validation", () => {
          const restrictiveGuardrails = createGuardrails({
            MAX_PERIOD: 60,
          });

          expect(() =>
            generateSync({
              secret,
              epoch: 59,
              period: 120,
              crypto,
              guardrails: restrictiveGuardrails,
            }),
          ).toThrow(PeriodTooLargeError);
        });

        it("should pass guardrails to underlying HOTP generation", () => {
          const lenientGuardrails = createGuardrails({
            MIN_SECRET_BYTES: 1,
          });

          const shortSecret = new Uint8Array(5);

          const result = generateSync({
            secret: shortSecret,
            epoch: 59,
            crypto,
            guardrails: lenientGuardrails,
          });

          expect(result).toMatch(/^\d{6}$/);
        });
      });

      describe("verify", () => {
        it("should respect custom guardrails for epochTolerance validation", async () => {
          const restrictiveGuardrails = createGuardrails({
            MAX_WINDOW: 5,
          });

          const token = await generate({
            secret,
            epoch: 59,
            crypto,
          });

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
          ).rejects.toThrow(EpochToleranceTooLargeError);
        });

        it("should pass guardrails to nested generate calls", async () => {
          const restrictiveGuardrails = createGuardrails({
            MIN_SECRET_BYTES: 8,
            MAX_SECRET_BYTES: 10,
          });

          const longSecret = new Uint8Array(20);

          await expect(
            verify({
              secret: longSecret,
              epoch: 59,
              token: "123456",
              crypto,
              guardrails: restrictiveGuardrails,
            }),
          ).rejects.toThrow(SecretTooLongError);
        });

        it("should use custom guardrails throughout verification with tolerance", async () => {
          const lenientGuardrails = createGuardrails({
            MIN_SECRET_BYTES: 1,
            MAX_WINDOW: 10,
          });

          const shortSecret = new Uint8Array(5);
          const token = await generate({
            secret: shortSecret,
            epoch: 100,
            period: 30,
            crypto,
            guardrails: lenientGuardrails,
          });

          const result = await verify({
            secret: shortSecret,
            epoch: 190,
            token,
            period: 30,
            crypto,
            epochTolerance: 150,
            guardrails: lenientGuardrails,
          });

          expect(result.valid).toBe(true);
        });

        it("should pass guardrails through TOTP->HOTP call chain", async () => {
          const customGuardrails = createGuardrails({
            MIN_SECRET_BYTES: 1,
            MAX_COUNTER: 1000,
          });

          const shortSecret = new Uint8Array(5);
          const token = await generate({
            secret: shortSecret,
            epoch: 59,
            crypto,
            guardrails: customGuardrails,
          });

          const result = await verify({
            secret: shortSecret,
            epoch: 59,
            token,
            crypto,
            guardrails: customGuardrails,
          });

          expect(result.valid).toBe(true);
        });
      });

      describe("verifySync", () => {
        it("should respect custom guardrails for epochTolerance validation", () => {
          const restrictiveGuardrails = createGuardrails({
            MAX_WINDOW: 5,
          });

          const token = generateSync({
            secret,
            epoch: 59,
            crypto,
          });

          expect(() =>
            verifySync({
              secret,
              epoch: 59,
              token,
              period: 30,
              crypto,
              epochTolerance: 300,
              guardrails: restrictiveGuardrails,
            }),
          ).toThrow(EpochToleranceTooLargeError);
        });

        it("should pass guardrails to nested generateSync calls", () => {
          const restrictiveGuardrails = createGuardrails({
            MIN_SECRET_BYTES: 8,
            MAX_SECRET_BYTES: 10,
          });

          const longSecret = new Uint8Array(20);

          expect(() =>
            verifySync({
              secret: longSecret,
              epoch: 59,
              token: "123456",
              crypto,
              guardrails: restrictiveGuardrails,
            }),
          ).toThrow(SecretTooLongError);
        });

        it("should pass guardrails through TOTP->HOTP call chain synchronously", () => {
          const customGuardrails = createGuardrails({
            MIN_SECRET_BYTES: 1,
            MAX_COUNTER: 1000,
          });

          const shortSecret = new Uint8Array(5);
          const token = generateSync({
            secret: shortSecret,
            epoch: 59,
            crypto,
            guardrails: customGuardrails,
          });

          const result = verifySync({
            secret: shortSecret,
            epoch: 59,
            token,
            crypto,
            guardrails: customGuardrails,
          });

          expect(result.valid).toBe(true);
        });
      });

      describe("getRemainingTime", () => {
        it("should respect custom guardrails for period validation", () => {
          const restrictiveGuardrails = createGuardrails({
            MAX_PERIOD: 60,
          });

          expect(() => getRemainingTime(59, 120, 0, restrictiveGuardrails)).toThrow(
            "Period must not exceed 60 seconds",
          );
        });

        it("should work with custom lenient guardrails", () => {
          const lenientGuardrails = createGuardrails({
            MIN_PERIOD: 1,
            MAX_PERIOD: 1000,
          });

          const remaining = getRemainingTime(59, 120, 0, lenientGuardrails);
          expect(remaining).toBeGreaterThan(0);
          expect(remaining).toBeLessThanOrEqual(120);
        });
      });

      describe("getTimeStepUsed", () => {
        it("should respect custom guardrails for period validation", () => {
          const restrictiveGuardrails = createGuardrails({
            MAX_PERIOD: 60,
          });

          expect(() => getTimeStepUsed(59, 120, 0, restrictiveGuardrails)).toThrow(
            "Period must not exceed 60 seconds",
          );
        });

        it("should work with custom lenient guardrails", () => {
          const lenientGuardrails = createGuardrails({
            MIN_PERIOD: 1,
            MAX_PERIOD: 1000,
          });

          const counter = getTimeStepUsed(59, 120, 0, lenientGuardrails);
          expect(counter).toBe(0);
        });
      });
    });
  });
}
