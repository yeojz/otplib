/**
 * Shared HOTP test suite
 *
 * This file contains the test logic that can be run across different runtimes
 * by injecting the test framework (describe, it, expect) and crypto plugin.
 */

import {
  stringToBytes,
  createGuardrails,
  SecretTooLongError,
  CounterOverflowError,
  CounterToleranceTooLargeError,
} from "@otplib/core";
import { RFC4226_VECTORS, BASE_SECRET } from "@repo/testing";

import { generate, generateSync, verify, verifySync } from "./index.ts";

import type { CryptoPlugin } from "@otplib/core";
import type { TestContext } from "@repo/testing";

/**
 * Creates the HOTP test suite with injected dependencies
 */
export function createHOTPTests(ctx: TestContext<CryptoPlugin>): void {
  const { describe, it, expect, crypto } = ctx;
  const secret = stringToBytes(BASE_SECRET);

  describe("HOTP", () => {
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

      it("should use default algorithm and digits parameters", async () => {
        const result = await generate({
          secret,
          counter: 0,
          crypto,
        });
        expect(result).toHaveLength(6);
        expect(result).toMatch(/^\d{6}$/);
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

      it("should generate 6-digit codes", async () => {
        const result = await generate({
          secret,
          counter: 0,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result).toHaveLength(6);
        expect(result).toMatch(/^\d{6}$/);
      });

      it("should generate 7-digit codes", async () => {
        const result = await generate({
          secret,
          counter: 0,
          algorithm: "sha1",
          digits: 7,
          crypto,
        });
        expect(result).toHaveLength(7);
        expect(result).toMatch(/^\d{7}$/);
      });

      it("should generate 8-digit codes", async () => {
        const result = await generate({
          secret,
          counter: 0,
          algorithm: "sha1",
          digits: 8,
          crypto,
        });
        expect(result).toHaveLength(8);
        expect(result).toMatch(/^\d{8}$/);
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

      it("should support bigint counter", async () => {
        const result = await generate({
          secret,
          counter: BigInt(0),
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result).toMatch(/^\d{6}$/);
      });

      it("should handle large counter values", async () => {
        const result = await generate({
          secret,
          counter: 999999,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result).toHaveLength(6);
        expect(result).toMatch(/^\d{6}$/);
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

      it("should use default algorithm and digits parameters in verify", async () => {
        const token = await generate({
          secret,
          counter: 0,
          crypto,
        });

        const result = await verify({
          secret,
          counter: 0,
          token,
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

      it("should verify with window - look-ahead", async () => {
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

      it("should verify with larger window", async () => {
        const token3 = await generate({
          secret,
          counter: 3,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          counter: 0,
          token: token3,
          algorithm: "sha1",
          digits: 6,
          crypto,
          counterTolerance: 3,
        });
        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.delta).toBe(3);
        }
      });

      it("should fail when token is outside window", async () => {
        const token9 = await generate({
          secret,
          counter: 9,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          counter: 0,
          token: token9,
          algorithm: "sha1",
          digits: 6,
          crypto,
          counterTolerance: 1,
        });
        expect(result.valid).toBe(false);
      });

      it("should verify with bigint counter", async () => {
        const token = await generate({
          secret,
          counter: BigInt(5),
          algorithm: "sha1",
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          counter: BigInt(5),
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
    });

    describe("Security - Replay Attack Prevention", () => {
      it("should reject same token after counter increment", async () => {
        // Generate a token for counter 5
        const token = await generate({
          secret,
          counter: 5,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });

        // First verification should succeed
        const result1 = await verify({
          secret,
          counter: 5,
          token,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result1.valid).toBe(true);

        // After counter increment, same token should fail
        // This demonstrates replay attack prevention
        const result2 = await verify({
          secret,
          counter: 6,
          token,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result2.valid).toBe(false);
      });

      it("should reject token reuse even with window", async () => {
        // Generate token for counter 10
        const token = await generate({
          secret,
          counter: 10,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });

        // Valid at counter 10 with window 2
        const result1 = await verify({
          secret,
          counter: 10,
          token,
          algorithm: "sha1",
          digits: 6,
          crypto,
          counterTolerance: 2,
        });
        expect(result1.valid).toBe(true);

        // After moving counter past the window, token is rejected
        // Counter 13 with window 2 checks [11, 12, 13, 14, 15] - token for 10 is outside
        const result2 = await verify({
          secret,
          counter: 13,
          token,
          algorithm: "sha1",
          digits: 6,
          crypto,
          counterTolerance: 2,
        });
        expect(result2.valid).toBe(false);
      });

      it("should demonstrate proper counter management for replay prevention", async () => {
        // Simulate a server that properly increments counter after each use
        // Using window=0 for strict counter matching (no look-ahead/look-back)
        let serverCounter = 0;

        // User generates token for counter 0
        const token0 = await generate({
          secret,
          counter: 0,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });

        // Server verifies with strict matching (window=0)
        const result1 = await verify({
          secret,
          counter: serverCounter,
          token: token0,
          algorithm: "sha1",
          digits: 6,
          crypto,
          counterTolerance: 0,
        });
        expect(result1.valid).toBe(true);
        if (result1.valid) {
          // Server increments counter past the used value
          serverCounter = serverCounter + result1.delta + 1;
        }
        expect(serverCounter).toBe(1);

        // Attacker tries to replay the same token - rejected because counter moved
        const replayResult = await verify({
          secret,
          counter: serverCounter,
          token: token0,
          algorithm: "sha1",
          digits: 6,
          crypto,
          counterTolerance: 0,
        });
        expect(replayResult.valid).toBe(false);

        // User generates new token for counter 1
        const token1 = await generate({
          secret,
          counter: 1,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });

        // Server verifies new token
        const result2 = await verify({
          secret,
          counter: serverCounter,
          token: token1,
          algorithm: "sha1",
          digits: 6,
          crypto,
          counterTolerance: 0,
        });
        expect(result2.valid).toBe(true);
      });

      it("should reject tokens from past counters", async () => {
        // Generate tokens for counters 0, 1, 2
        const tokens = await Promise.all([
          generate({ secret, counter: 0, algorithm: "sha1", digits: 6, crypto }),
          generate({ secret, counter: 1, algorithm: "sha1", digits: 6, crypto }),
          generate({ secret, counter: 2, algorithm: "sha1", digits: 6, crypto }),
        ]);

        // Verify at counter 2 - only token[2] should be valid (with window 0)
        const results = await Promise.all([
          verify({
            secret,
            counter: 2,
            token: tokens[0],
            algorithm: "sha1",
            digits: 6,
            crypto,
            counterTolerance: 0,
          }),
          verify({
            secret,
            counter: 2,
            token: tokens[1],
            algorithm: "sha1",
            digits: 6,
            crypto,
            counterTolerance: 0,
          }),
          verify({
            secret,
            counter: 2,
            token: tokens[2],
            algorithm: "sha1",
            digits: 6,
            crypto,
            counterTolerance: 0,
          }),
        ]);

        expect(results[0].valid).toBe(false); // Counter 0 token rejected
        expect(results[1].valid).toBe(false); // Counter 1 token rejected
        expect(results[2].valid).toBe(true); // Counter 2 token valid
      });

      it("should skip invalid counters in window and continue checking", async () => {
        // Generate a token for counter 1
        const token = await generate({
          secret,
          counter: 1,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });

        // Verify at counter 0 with counterTolerance that includes negative counters
        // The function should skip invalid counter -1 (which would throw CounterNegativeError)
        // and continue checking counter 0 and 1
        const result = await verify({
          secret,
          counter: 0,
          token,
          algorithm: "sha1",
          digits: 6,
          crypto,
          counterTolerance: 2,
        });

        // Should find the token at counter 1 (delta +1)
        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.delta).toBe(1);
        }
      });
    });

    describe("Edge Cases - Counter Boundaries", () => {
      it("should handle counter at MAX_SAFE_INTEGER", async () => {
        const maxCounter = Number.MAX_SAFE_INTEGER;
        const result = await generate({
          secret,
          counter: maxCounter,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result).toHaveLength(6);
        expect(result).toMatch(/^\d{6}$/);
      });

      it("should handle counter as bigint at MAX_SAFE_INTEGER", async () => {
        const maxCounter = BigInt(Number.MAX_SAFE_INTEGER);
        const result = await generate({
          secret,
          counter: maxCounter,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result).toHaveLength(6);
        expect(result).toMatch(/^\d{6}$/);
      });

      it("should verify token at MAX_SAFE_INTEGER counter", async () => {
        const maxCounter = Number.MAX_SAFE_INTEGER;
        const token = await generate({
          secret,
          counter: maxCounter,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });

        const result = await verify({
          secret,
          counter: maxCounter,
          token,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result.valid).toBe(true);
      });

      it("should generate different codes for consecutive large counters", async () => {
        const largeCounter = 1000000000000;
        const result1 = await generate({
          secret,
          counter: largeCounter,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        const result2 = await generate({
          secret,
          counter: largeCounter + 1,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result1).not.toBe(result2);
      });

      it("should handle counter 0", async () => {
        const result = await generate({
          secret,
          counter: 0,
          algorithm: "sha1",
          digits: 6,
          crypto,
        });
        expect(result).toHaveLength(6);
        expect(result).toMatch(/^\d{6}$/);
      });

      it("should produce consistent results for same counter", async () => {
        const counter = 12345678901234;
        const results = await Promise.all([
          generate({ secret, counter, algorithm: "sha1", digits: 6, crypto }),
          generate({ secret, counter, algorithm: "sha1", digits: 6, crypto }),
          generate({ secret, counter, algorithm: "sha1", digits: 6, crypto }),
        ]);
        expect(results[0]).toBe(results[1]);
        expect(results[1]).toBe(results[2]);
      });
    });

    describe("Synchronous API", () => {
      describe("generateSync", () => {
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

        RFC4226_VECTORS.forEach(({ counter, expected }) => {
          it(`should generate RFC 4226 vector for counter ${counter} synchronously`, () => {
            const result = generateSync({
              secret,
              counter,
              algorithm: "sha1",
              digits: 6,
              crypto,
            });
            expect(result).toBe(expected);
          });
        });

        it("should support all digit lengths", () => {
          const result6 = generateSync({ secret, counter: 0, digits: 6, crypto });
          const result7 = generateSync({ secret, counter: 0, digits: 7, crypto });
          const result8 = generateSync({ secret, counter: 0, digits: 8, crypto });
          expect(result6).toHaveLength(6);
          expect(result7).toHaveLength(7);
          expect(result8).toHaveLength(8);
        });

        it("should support all algorithms", () => {
          const sha1 = generateSync({ secret, counter: 0, algorithm: "sha1", digits: 6, crypto });
          const sha256 = generateSync({
            secret,
            counter: 0,
            algorithm: "sha256",
            digits: 6,
            crypto,
          });
          const sha512 = generateSync({
            secret,
            counter: 0,
            algorithm: "sha512",
            digits: 6,
            crypto,
          });
          expect(sha1).toHaveLength(6);
          expect(sha256).toHaveLength(6);
          expect(sha512).toHaveLength(6);
        });
      });

      describe("verifySync", () => {
        it("should verify valid code synchronously", () => {
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
          if (result.valid) {
            expect(result.delta).toBe(0);
          }
        });

        it("should reject invalid code synchronously", () => {
          const result = verifySync({
            secret,
            counter: 0,
            token: "000000",
            algorithm: "sha1",
            digits: 6,
            crypto,
          });
          expect(result.valid).toBe(false);
        });

        it("should respect counterTolerance", () => {
          const token = generateSync({
            secret,
            counter: 3,
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
            counterTolerance: 5,
          });
          expect(result.valid).toBe(true);
          if (result.valid) {
            expect(result.delta).toBe(3);
          }
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

        it("should allow values that pass custom guardrails but would fail defaults", async () => {
          const lenientGuardrails = createGuardrails({
            MIN_SECRET_BYTES: 1,
          });

          const shortSecret = new Uint8Array(5);

          const result = await generate({
            secret: shortSecret,
            counter: 0,
            crypto,
            guardrails: lenientGuardrails,
          });

          expect(result).toMatch(/^\d{6}$/);
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
              counter: 0,
              crypto,
              guardrails: restrictiveGuardrails,
            }),
          ).toThrow(SecretTooLongError);
        });

        it("should respect custom guardrails for counter validation", () => {
          const restrictiveGuardrails = createGuardrails({
            MAX_COUNTER: 100,
          });

          expect(() =>
            generateSync({
              secret,
              counter: 101,
              crypto,
              guardrails: restrictiveGuardrails,
            }),
          ).toThrow(CounterOverflowError);
        });
      });

      describe("verify", () => {
        it("should respect custom guardrails for counterTolerance validation", async () => {
          const restrictiveGuardrails = createGuardrails({
            MAX_WINDOW: 5,
          });

          const token = await generate({
            secret,
            counter: 0,
            crypto,
          });

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

        it("should pass guardrails to nested generate calls", async () => {
          const restrictiveGuardrails = createGuardrails({
            MIN_SECRET_BYTES: 8,
            MAX_SECRET_BYTES: 10,
          });

          const longSecret = new Uint8Array(20);

          await expect(
            verify({
              secret: longSecret,
              counter: 0,
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
            counter: 5,
            crypto,
            guardrails: lenientGuardrails,
          });

          const result = await verify({
            secret: shortSecret,
            counter: 0,
            token,
            crypto,
            counterTolerance: 9, // [0, 9] = 10 total checks ≤ MAX_WINDOW
            guardrails: lenientGuardrails,
          });

          expect(result.valid).toBe(true);
          if (result.valid) {
            expect(result.delta).toBe(5);
          }
        });
      });

      describe("verifySync", () => {
        it("should respect custom guardrails for counterTolerance validation", () => {
          const restrictiveGuardrails = createGuardrails({
            MAX_WINDOW: 5,
          });

          const token = generateSync({
            secret,
            counter: 0,
            crypto,
          });

          expect(() =>
            verifySync({
              secret,
              counter: 0,
              token,
              crypto,
              counterTolerance: 10,
              guardrails: restrictiveGuardrails,
            }),
          ).toThrow(CounterToleranceTooLargeError);
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
              counter: 0,
              token: "123456",
              crypto,
              guardrails: restrictiveGuardrails,
            }),
          ).toThrow(SecretTooLongError);
        });
      });
    });
  });
}
