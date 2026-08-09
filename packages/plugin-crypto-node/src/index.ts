import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import {
  normalizeHashAlgorithm,
  stringToBytes,
  validateByteLengthEqual,
  type CryptoPlugin,
  type HashAlgorithm,
} from "@otplib/core";

/**
 * OpenSSL digest name keyed by canonical algorithm name
 *
 * An explicit map rather than forwarding the caller's string: passing it
 * straight through is how this plugin used to inherit OpenSSL's whole digest
 * catalogue, accepting `md5`, `sha224` and `ripemd160`. Routing through a
 * closed map makes that structural rather than a matter of validating first.
 *
 * The `satisfies` constraint forbids a key outside `HashAlgorithm` and
 * requires every member of it.
 */
const OPENSSL_DIGESTS = {
  sha1: "sha1",
  sha256: "sha256",
  sha512: "sha512",
} as const satisfies Record<HashAlgorithm, string>;

/**
 * Algorithms this plugin can compute
 *
 * Derived from the digest map rather than written out again, so the declared
 * set cannot disagree with what `hmac` actually handles.
 */
const SUPPORTED_ALGORITHMS = Object.keys(OPENSSL_DIGESTS) as readonly HashAlgorithm[];

/**
 * Node.js crypto module implementation of CryptoPlugin
 *
 * This plugin uses Node.js's built-in crypto module which provides:
 * - OpenSSL-backed HMAC operations
 * - Cryptographically secure random byte generation
 * - Synchronous API for optimal performance
 *
 * @example
 * ```ts
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 *
 * const crypto = new NodeCryptoPlugin();
 * const hmac = await crypto.hmac('sha1', key, data);
 * const random = crypto.randomBytes(20);
 * ```
 */
export class NodeCryptoPlugin implements CryptoPlugin {
  /**
   * Plugin name for identification
   */
  readonly name = "node";

  /**
   * Algorithms this plugin can compute
   */
  readonly algorithms = SUPPORTED_ALGORITHMS;

  /**
   * Compute HMAC using Node.js crypto module
   *
   * Synchronous implementation using createHmac.
   *
   * The algorithm is matched ignoring case and separators, so `'SHA1'`,
   * `'Sha1'` and `'SHA-1'` all resolve to `'sha1'`. Any other digest OpenSSL
   * happens to support - `'md5'`, `'sha224'`, `'ripemd160'` - throws
   * `AlgorithmUnsupportedError`.
   *
   * @param algorithm - Hash algorithm to use
   * @param key - Secret key
   * @param data - Data to authenticate
   * @returns HMAC digest
   * @throws {AlgorithmUnsupportedError} If the algorithm is not supported
   */
  hmac(algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array): Uint8Array {
    const alg = normalizeHashAlgorithm(algorithm, { plugin: this.name });
    const hmac = createHmac(OPENSSL_DIGESTS[alg], key);
    hmac.update(data);
    return new Uint8Array(hmac.digest());
  }

  /**
   * Generate cryptographically secure random bytes
   *
   * Uses Node.js's randomBytes which is backed by OpenSSL.
   *
   * @param length - Number of bytes to generate
   * @returns Random bytes
   */
  randomBytes(length: number): Uint8Array {
    return new Uint8Array(randomBytes(length));
  }

  /**
   * Constant-time comparison using Node.js crypto.timingSafeEqual
   *
   * Uses Node.js's built-in timing-safe comparison which prevents
   * timing side-channel attacks.
   *
   * @param a - First value to compare
   * @param b - Second value to compare
   * @returns true if values are equal, false otherwise
   */
  constantTimeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean {
    const bufA = stringToBytes(a);
    const bufB = stringToBytes(b);

    if (!validateByteLengthEqual(bufA, bufB)) {
      return false;
    }

    return timingSafeEqual(bufA, bufB);
  }
}

/**
 * Default singleton instance for convenience
 *
 * @example
 * ```ts
 * import { crypto } from '@otplib/plugin-crypto-node';
 *
 * const hmac = crypto.hmac('sha1', key, data);
 * ```
 */
export const crypto: CryptoPlugin = Object.freeze(new NodeCryptoPlugin());

export default NodeCryptoPlugin;
