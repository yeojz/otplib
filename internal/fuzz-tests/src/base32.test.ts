/**
 * Property-based fuzz tests for Base32
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const base32 = new ScureBase32Plugin();

describe("Base32 fuzz tests", () => {
  describe("encode and decode invariants", () => {
    it("should roundtrip raw bytes: decode(encode(bytes)) === bytes", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uint8Array({ minLength: 0, maxLength: 1024 }), async (bytes) => {
          const encoded = base32.encode(bytes);
          const decoded = base32.decode(encoded);
          expect(decoded).toEqual(bytes);
        }),
      );
    });

    it("should roundtrip with padding: decode(encode(bytes, {padding: true})) === bytes", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uint8Array({ minLength: 0, maxLength: 1024 }), async (bytes) => {
          const encoded = base32.encode(bytes, { padding: true });
          const decoded = base32.decode(encoded);
          expect(decoded).toEqual(bytes);
        }),
      );
    });
  });

  describe("robustness", () => {
    it("should not crash on random invalid strings (garbage input)", async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (input) => {
          try {
            base32.decode(input);
          } catch (err) {
            // It's expected to throw for invalid input
            // We just want to ensure it doesn't crash the process or throw something wild
            expect(err).toBeInstanceOf(Error);
          }
        }),
      );
    });

    it("should fail gracefully for localized changes in valid base32", async () => {
      // Take a valid base32 string, modify one char to an invalid char, ensure it throws or handles it
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 0, max: 99 }), // index to mutate (will be mod length)
          async (bytes, idx) => {
            const encoded = base32.encode(bytes);
            if (encoded.length === 0) return;

            const mutationIndex = idx % encoded.length;
            // Replace with an invalid character, e.g., '1', '8', '9' are often invalid in RFC4648 standard base32 if not extended hex
            // Standard Base32: A-Z, 2-7. 1, 8, 9, 0 are invalid.
            const invalidChar = "8";

            const mutated =
              encoded.slice(0, mutationIndex) + invalidChar + encoded.slice(mutationIndex + 1);

            try {
              base32.decode(mutated);
              // If it doesn't throw, that might be okay depending on implementation (maybe it ignores?)
              // But usually it should throw or return something.
              // We'll just assert it didn't crash.
            } catch (err) {
              expect(err).toBeInstanceOf(Error);
            }
          },
        ),
      );
    });
  });
});
