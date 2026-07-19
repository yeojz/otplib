import { RFC_TEST_SECRET } from "./rfc-test-vectors.js";
import { counterToBytes, stringToBytes } from "./utils.js";

import type { TestContext } from "./types.js";

/**
 * Minimal interface for a crypto plugin under test
 *
 * Declared locally rather than imported from `@otplib/core` so this package
 * stays dependency-free and can also run against built `dist/` output.
 */
interface CryptoPluginUnderTest {
  name: string;
  hmac(algorithm: string, key: Uint8Array, data: Uint8Array): Promise<Uint8Array> | Uint8Array;
}

/**
 * Digest sizes in bytes for each supported algorithm
 */
const DIGEST_SIZES = [
  { algorithm: "sha1", bytes: 20 },
  { algorithm: "sha256", bytes: 32 },
  { algorithm: "sha512", bytes: 64 },
] as const;

/**
 * Case variants that must resolve to a canonical algorithm
 */
const CASE_VARIANTS = [
  { input: "SHA1", canonical: "sha1" },
  { input: "Sha1", canonical: "sha1" },
  { input: "sHa1", canonical: "sha1" },
  { input: "SHA256", canonical: "sha256" },
  { input: "Sha256", canonical: "sha256" },
  { input: "SHA512", canonical: "sha512" },
  { input: "Sha512", canonical: "sha512" },
] as const;

/**
 * Values that must be rejected
 *
 * Separator variants are included deliberately: they are only tolerated when
 * parsing third-party `otpauth://` URIs, never at the crypto layer.
 */
const REJECTED_ALGORITHMS: readonly unknown[] = [
  "SHA-1",
  "sha-1",
  "SHA-256",
  "sha-512",
  "sha_1",
  "sha 1",
  "md5",
  "sha3-256",
  "sha384",
  "sha1 ",
  " sha1",
  "",
  undefined,
  null,
  0,
  1,
  {},
  [],
  ["sha1"],
];

/**
 * Context for the crypto algorithm conformance suite
 */
export type CryptoAlgorithmTestContext = TestContext<CryptoPluginUnderTest> & {
  /**
   * The `AlgorithmUnsupportedError` class, injected by the caller so this
   * package does not need to depend on `@otplib/core`.
   */
  errorClass: new (...args: any[]) => Error;
};

/**
 * Capture the error thrown by an operation
 *
 * Works for both synchronous plugins (node, noble) and asynchronous ones
 * (web), so a single assertion covers all implementations.
 */
async function captureError(fn: () => unknown): Promise<unknown> {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}

/**
 * Shared conformance suite for crypto plugin algorithm handling
 *
 * Every crypto plugin must behave identically here. The three plugins
 * previously hand-rolled their own algorithm dispatch and silently diverged -
 * `@otplib/plugin-crypto-noble` computed HMAC-SHA512 for any unrecognised
 * value, producing tokens that never matched other implementations.
 *
 * @param ctx - Test context including the plugin and the expected error class
 *
 * @example
 * ```ts
 * import { describe, it, expect } from "vitest";
 * import { AlgorithmUnsupportedError } from "@otplib/core";
 * import { createCryptoAlgorithmTests } from "@repo/testing";
 * import { NodeCryptoPlugin } from "./index";
 *
 * createCryptoAlgorithmTests({
 *   describe,
 *   it,
 *   expect,
 *   crypto: new NodeCryptoPlugin(),
 *   errorClass: AlgorithmUnsupportedError,
 * });
 * ```
 */
export function createCryptoAlgorithmTests(ctx: CryptoAlgorithmTestContext): void {
  const { describe, it, expect, crypto, errorClass } = ctx;

  const key = stringToBytes(RFC_TEST_SECRET);
  const data = counterToBytes(0);

  describe(`${crypto.name} crypto plugin - algorithm handling`, () => {
    describe("canonical algorithms", () => {
      for (const { algorithm, bytes } of DIGEST_SIZES) {
        it(`should produce a ${bytes}-byte digest for "${algorithm}"`, async () => {
          const digest = await crypto.hmac(algorithm, key, data);
          expect(digest).toHaveLength(bytes);
        });
      }

      // Regression guard for the silent SHA-512 fallback: an unrecognised
      // algorithm used to fall through to sha512, so sha1 returning 64 bytes
      // is the exact signature of the bug.
      it('should never return a 64-byte digest for "sha1"', async () => {
        const digest = await crypto.hmac("sha1", key, data);
        expect(digest).toHaveLength(20);
      });
    });

    describe("case-insensitive matching", () => {
      for (const { input, canonical } of CASE_VARIANTS) {
        // Compares bytes rather than just asserting "did not throw": a plugin
        // that accepted "SHA1" and quietly computed SHA-512 would pass a
        // does-not-throw check, which is the bug being guarded against.
        it(`should treat "${input}" as "${canonical}"`, async () => {
          const actual = await crypto.hmac(input, key, data);
          const expected = await crypto.hmac(canonical, key, data);
          expect(actual).toEqual(expected);
        });
      }
    });

    describe("unsupported algorithms", () => {
      for (const value of REJECTED_ALGORITHMS) {
        const label = typeof value === "string" ? `"${value}"` : String(value);

        it(`should throw AlgorithmUnsupportedError for ${label}`, async () => {
          const error = await captureError(() => crypto.hmac(value as string, key, data));

          expect(error).toBeInstanceOf(errorClass);
        });
      }
    });
  });
}
