/**
 * Property-based fuzz tests for TOTP
 *
 * Tests the public API from a package user's perspective
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { TOTP } from "@otplib/totp";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { generateSecret as generateSecretCore } from "@otplib/core";

const crypto = new NodeCryptoPlugin();
const base32 = new ScureBase32Plugin();

describe("TOTP class fuzz tests", () => {
  describe("secret generation", () => {
    it("should always generate valid Base32 secrets", () => {
      fc.assert(
        fc.property(fc.integer({ min: 16, max: 64 }), (length) => {
          const secret = generateSecretCore({ crypto, base32, length });

          expect(typeof secret).toBe("string");
          expect(secret.length).toBeGreaterThan(0);
          expect(secret).toMatch(/^[A-Z2-7]+$/);
        }),
      );
    });

    it("should generate secrets with proper entropy", () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const secrets = new Set();
          for (let i = 0; i < 100; i++) {
            secrets.add(generateSecretCore({ crypto, base32 }));
          }

          expect(secrets.size).toBe(100);
        }),
      );
    });
  });

  describe("generate and verify with Base32 secrets", () => {
    it("should handle lowercase Base32 secrets (plugin normalizes)", async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 16, max: 64 }), async (length) => {
          // Use generateSecret to ensure valid Base32
          const upperSecret = generateSecretCore({ crypto, base32, length });
          const lowerSecret = upperSecret.toLowerCase();
          const totp = new TOTP({ crypto, base32 });

          const token = await totp.generate({ secret: lowerSecret });
          const result = await totp.verify(token, { secret: lowerSecret });

          expect(result.valid).toBe(true);
        }),
      );
    });

    it("should generate and verify tokens correctly", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 16, max: 64 }),
          fc.integer({ min: 0, max: 2000000000 }),
          async (length, epoch) => {
            // Use generateSecret to ensure valid Base32
            const secret = generateSecretCore({ crypto, base32, length });
            const totp = new TOTP({ crypto, base32 });

            const token = await totp.generate({ secret, epoch });
            const result = await totp.verify(token, { secret, epoch });

            expect(result.valid).toBe(true);
          },
        ),
      );
    });
  });

  describe("time-based token generation", () => {
    it("should produce different tokens across time windows", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 16, maxLength: 64 }),
          fc.integer({ min: 0, max: 2000000000 }),
          fc.integer({ min: 30, max: 60 }),
          async (secret, epoch, period) => {
            const totp = new TOTP({ crypto, base32, period });

            const token1 = await totp.generate({ secret, epoch });
            const token2 = await totp.generate({ secret, epoch: epoch + period });

            expect(token1).not.toBe(token2);
          },
        ),
      );
    });

    it("should be deterministic within same time window", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 16, maxLength: 64 }),
          fc.integer({ min: 0, max: 2000000000 }),
          async (secret, epoch) => {
            const totp = new TOTP({ crypto, base32 });

            const token1 = await totp.generate({ secret, epoch });
            const token2 = await totp.generate({ secret, epoch });

            expect(token1).toBe(token2);
          },
        ),
      );
    });
  });
});
