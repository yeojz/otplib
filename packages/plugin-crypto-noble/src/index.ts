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
 */
const HASH_FNS = {
  sha1,
  sha256,
  sha512,
} as const;

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
   * Compute HMAC using @noble/hashes
   *
   * Synchronous implementation using pure JS.
   *
   * The algorithm is matched case-insensitively (`'SHA1'` and `'Sha1'` both
   * resolve to `'sha1'`). Anything else - including separator spellings such
   * as `'SHA-1'` - throws `AlgorithmUnsupportedError`.
   *
   * @param algorithm - Hash algorithm to use
   * @param key - Secret key
   * @param data - Data to authenticate
   * @returns HMAC digest
   * @throws {AlgorithmUnsupportedError} If the algorithm is not supported
   */
  hmac(algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array): Uint8Array {
    const alg = normalizeHashAlgorithm(algorithm, undefined, this.name);
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
