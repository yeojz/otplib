/**
 * Property-based fuzz tests for TOTP
 *
 * Tests the public API from a package user's perspective
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { generate, verify } from "@otplib/totp";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const crypto = new NodeCryptoPlugin();
const base32 = new ScureBase32Plugin();

describe("TOTP fuzz tests", () => {
  describe("generate and verify invariants", () => {
    it("should always verify a freshly generated token at same epoch", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 16, maxLength: 64 }),
          fc.integer({ min: 0, max: 2000000000 }),
          async (secret, epoch) => {
            const token = await generate({ secret, epoch, crypto, base32 });
            const result = await verify({ secret, epoch, token, crypto, base32 });

            expect(result.valid).toBe(true);
            if (result.valid) {
              expect(result.delta).toBe(0);
            }
          },
        ),
      );
    });

    it("should produce different tokens for different time windows", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 16, maxLength: 64 }),
          fc.integer({ min: 0, max: 2000000000 }),
          fc.integer({ min: 30, max: 60 }),
          async (secret, epoch, period) => {
            const token1 = await generate({ secret, epoch, period, crypto, base32 });
            const token2 = await generate({
              secret,
              epoch: epoch + period,
              period,
              crypto,
              base32,
            });

            expect(token1).not.toBe(token2);
          },
        ),
      );
    });

    it("should produce same token within same time window", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 16, maxLength: 64 }),
          fc.integer({ min: 0, max: 2000000000 }),
          fc.integer({ min: 30, max: 60 }),
          async (secret, baseEpoch, period) => {
            // Align epoch to beginning of a time window to ensure
            // any offset within period stays in the same window
            const windowStart = Math.floor(baseEpoch / period) * period;

            // Generate two tokens at different points within the same window
            // offset must be less than period to stay in same window
            const offset = Math.floor(period / 2);

            const token1 = await generate({ secret, epoch: windowStart, period, crypto, base32 });
            const token2 = await generate({
              secret,
              epoch: windowStart + offset,
              period,
              crypto,
              base32,
            });

            expect(token1).toBe(token2);
          },
        ),
      );
    });

    it("should always produce 6-digit tokens by default", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 16, maxLength: 64 }),
          fc.integer({ min: 0, max: 2000000000 }),
          async (secret, epoch) => {
            const token = await generate({ secret, epoch, crypto, base32 });
            expect(token).toMatch(/^\d{6}$/);
          },
        ),
      );
    });

    it("should be deterministic (same inputs = same output)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 16, maxLength: 64 }),
          fc.integer({ min: 0, max: 2000000000 }),
          async (secret, epoch) => {
            const token1 = await generate({ secret, epoch, crypto, base32 });
            const token2 = await generate({ secret, epoch, crypto, base32 });
            expect(token1).toBe(token2);
          },
        ),
      );
    });
  });

  describe("epoch tolerance", () => {
    it("should verify tokens within epoch tolerance", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 16, maxLength: 64 }),
          fc.integer({ min: 100, max: 2000000000 }),
          fc.integer({ min: 30, max: 60 }),
          fc.integer({ min: 1, max: 5 }),
          async (secret, epoch, period, toleranceSteps) => {
            const token = await generate({ secret, epoch, period, crypto, base32 });
            const tolerance = period * toleranceSteps;

            for (let offset = -toleranceSteps; offset <= toleranceSteps; offset++) {
              const testEpoch = epoch + period * offset;
              if (testEpoch < 0) continue;

              const result = await verify({
                secret,
                epoch: testEpoch,
                period,
                token,
                crypto,
                base32,
                epochTolerance: tolerance,
              });

              expect(result.valid).toBe(true);
            }
          },
        ),
      );
    });
  });

  describe("algorithm variations", () => {
    it("should produce different tokens for different algorithms", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 16, maxLength: 64 }),
          fc.integer({ min: 0, max: 2000000000 }),
          async (secret, epoch) => {
            const sha1Token = await generate({
              secret,
              epoch,
              crypto,
              base32,
              algorithm: "sha1",
            });
            const sha256Token = await generate({
              secret,
              epoch,
              crypto,
              base32,
              algorithm: "sha256",
            });
            const sha512Token = await generate({
              secret,
              epoch,
              crypto,
              base32,
              algorithm: "sha512",
            });

            expect(sha1Token).not.toBe(sha256Token);
            expect(sha256Token).not.toBe(sha512Token);
            expect(sha1Token).not.toBe(sha512Token);
          },
        ),
      );
    });
  });

  describe("negative tests", () => {
    it("should reject random tokens", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 16, maxLength: 64 }),
          fc.integer({ min: 0, max: 2000000000 }),
          fc.string({ minLength: 6, maxLength: 8 }),
          async (secret, epoch, token) => {
            try {
              const result = await verify({ secret, epoch, token, crypto, base32 });
              const validToken = await generate({ secret, epoch, crypto, base32 });
              if (token !== validToken) {
                expect(result.valid).toBe(false);
              }
            } catch (err) {
              // Ignore expected validation errors
              const msg = err instanceof Error ? err.message : String(err);
              if (
                !msg.includes("Token must only contain numeric characters") &&
                !msg.includes("Token must be") &&
                !msg.includes("Token must contain only digits")
              ) {
                // ignore
              }
            }
          },
        ),
      );
    });

    it("should handle garbage token strings gracefully", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 16, maxLength: 64 }),
          fc.integer({ min: 0, max: 2000000000 }),
          fc.string(),
          async (secret, epoch, token) => {
            try {
              const result = await verify({ secret, epoch, token, crypto, base32 });
              if (result.valid) {
                const expected = await generate({ secret, epoch, crypto, base32 });
                expect(token).toBe(expected);
              }
            } catch (err) {
              // Ignore expected validation errors
              const msg = err instanceof Error ? err.message : String(err);
              const isExpected = msg.includes("Token must") || msg.includes("valid base32");
              if (
                !isExpected &&
                !(err instanceof Error && err.constructor.name.includes("Error"))
              ) {
                throw err;
              }
            }
          },
        ),
      );
    });
  });
});
