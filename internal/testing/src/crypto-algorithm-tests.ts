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
 * Alternate spellings that must resolve to a canonical algorithm
 *
 * Case and `-`/`_` separators are ignored, so every entry here names the same
 * algorithm as its canonical form.
 */
const SPELLING_VARIANTS = [
  { input: "SHA1", canonical: "sha1" },
  { input: "Sha1", canonical: "sha1" },
  { input: "sHa1", canonical: "sha1" },
  { input: "SHA256", canonical: "sha256" },
  { input: "Sha256", canonical: "sha256" },
  { input: "SHA512", canonical: "sha512" },
  { input: "Sha512", canonical: "sha512" },
  { input: "SHA-1", canonical: "sha1" },
  { input: "sha-1", canonical: "sha1" },
  { input: "sha_1", canonical: "sha1" },
  { input: "SHA-256", canonical: "sha256" },
  { input: "sha-512", canonical: "sha512" },
] as const;

/**
 * Values that must be rejected
 *
 * Includes the near misses that make separator stripping safe: `sha3-256` and
 * `sha-384` must not collapse onto a supported algorithm.
 */
const REJECTED_ALGORITHMS: readonly { label: string; value: unknown }[] = [
  ...["md5", "sha3-256", "sha-384", "sha384", "sha-224", "sha 1", "sha1 ", " sha1", "", "----"].map(
    (value) => ({ label: `"${value}"`, value }),
  ),
  { label: "undefined", value: undefined },
  { label: "null", value: null },
  { label: "0", value: 0 },
  { label: "1", value: 1 },
  { label: "{}", value: {} },
  { label: "[]", value: [] },
  { label: '["sha1"]', value: ["sha1"] },

  // Labels are written out rather than derived via String(), because these
  // values are precisely the ones String() cannot handle - deriving the label
  // would throw while collecting the suite.
  { label: "a null-prototype object", value: Object.create(null) },
  {
    label: "an object whose toString throws",
    value: {
      toString() {
        throw new Error("boom");
      },
    },
  },
  {
    label: "a boxed string",
    value: new String("sha1"),
  },
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

    describe("case- and separator-insensitive matching", () => {
      for (const { input, canonical } of SPELLING_VARIANTS) {
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
      for (const { label, value } of REJECTED_ALGORITHMS) {
        // Asserts the exact error class, not merely "threw": a plugin that
        // rejects by crashing on the value (rather than validating it) would
        // pass a did-it-throw check while breaking the documented contract.
        it(`should throw AlgorithmUnsupportedError for ${label}`, async () => {
          const error = await captureError(() => crypto.hmac(value as string, key, data));

          expect(error).toBeInstanceOf(errorClass);
        });
      }
    });
  });
}
