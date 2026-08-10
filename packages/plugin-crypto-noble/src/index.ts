import { hmac } from "@noble/hashes/hmac.js";
import { sha1 } from "@noble/hashes/legacy.js";
import { sha256, sha512 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/hashes/utils.js";
import { constantTimeEqual as constantTimeEqualUtil, normalizeHashAlgorithm } from "@otplib/core";

import type { CryptoPlugin, HashAlgorithm } from "@otplib/core";

/**
 * Hash function lookup keyed by canonical algorithm name
 *
 * Deliberately has no fallback branch: unsupported values are rejected by
 * `normalizeHashAlgorithm` before they ever reach this map.
 *
 * The `satisfies` constraint forbids a key outside `HashAlgorithm`, so this
 * plugin cannot widen the allowlist, and requires every member of it, so a
 * newly supported algorithm fails to compile until it is dispatched here.
 */
const HASH_FNS = {
  sha1,
  sha256,
  sha512,
} as const satisfies Record<HashAlgorithm, unknown>;

/**
 * Algorithms this plugin can compute
 *
 * Derived from the dispatch map rather than written out again, so the declared
 * set cannot disagree with what `hmac` actually handles. Frozen because
 * `readonly` is erased at compile time, so an unfrozen array exposed as
 * `plugin.algorithms` could be mutated in-process to broaden it.
 */
const SUPPORTED_ALGORITHMS = Object.freeze(Object.keys(HASH_FNS) as HashAlgorithm[]);

/**
 * Pure JavaScript implementation of CryptoPlugin
 *
 * This plugin uses @noble/hashes which provides:
 * - Pure JavaScript implementations of hash functions
 * - Zero dependencies and audited code
 * - Cross-platform compatibility (Node.js, browser, edge)
 * - Fallback for environments without native crypto APIs
 *
 * @example
 * ```ts
 * import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
 *
 * const crypto = new NobleCryptoPlugin();
 * const hmac = crypto.hmac('sha1', key, data);
 * const random = crypto.randomBytes(20);
 * ```
 */
export class NobleCryptoPlugin implements CryptoPlugin {
  /**
   * Plugin name for identification
   */
  readonly name = "noble";

  /**
   * Algorithms this plugin can compute
   */
  readonly algorithms = SUPPORTED_ALGORITHMS;

  /**
   * Compute HMAC using @noble/hashes
   *
   * Synchronous implementation using pure JS.
   *
   * The algorithm is matched ignoring case, with an optional `-` or `_` before
   * the digest size, so `'SHA1'`, `'Sha1'` and `'SHA-1'` all resolve to
   * `'sha1'`. Any other digest throws `AlgorithmUnsupportedError` rather than
   * falling back to a default.
   *
   * @param algorithm - Hash algorithm to use
   * @param key - Secret key
   * @param data - Data to authenticate
   * @returns HMAC digest
   * @throws {AlgorithmUnsupportedError} If the algorithm is not supported
   */
  hmac(algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array): Uint8Array {
    const alg = normalizeHashAlgorithm(algorithm, {
      supported: this.algorithms,
      plugin: this.name,
    });
    return hmac(HASH_FNS[alg], key, data);
  }

  /**
   * Generate cryptographically secure random bytes
   *
   * Uses @noble/hashes' randomBytes which is backed by:
   * - Node.js crypto.randomBytes in Node.js
   * - crypto.getRandomValues in browsers
   * - A PRNG as fallback
   *
   * @param length - Number of bytes to generate
   * @returns Random bytes
   */
  randomBytes(length: number): Uint8Array {
    return randomBytes(length);
  }

  /**
   * Constant-time comparison to prevent timing side-channel attacks
   *
   * @noble/hashes doesn't provide a constant-time comparison,
   * so we Use the core utility implementation.
   *
   * @param a - First value to compare
   * @param b - Second value to compare
   * @returns true if values are equal, false otherwise
   */
  constantTimeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean {
    return constantTimeEqualUtil(a, b);
  }
}

/**
 * Default singleton instance for convenience
 *
 * @example
 * ```ts
 * import { crypto } from '@otplib/plugin-crypto-noble';
 *
 * const hmac = crypto.hmac('sha1', key, data);
 * ```
 */
export const crypto: CryptoPlugin = Object.freeze(new NobleCryptoPlugin());

export default NobleCryptoPlugin;
