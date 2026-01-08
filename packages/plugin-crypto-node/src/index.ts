import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { stringToBytes, type CryptoPlugin } from "@otplib/core";

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
   * Compute HMAC using Node.js crypto module
   *
   * Synchronous implementation using createHmac.
   *
   * @param algorithm - Hash algorithm to use
   * @param key - Secret key
   * @param data - Data to authenticate
   * @returns HMAC digest
   */
  hmac(algorithm: "sha1" | "sha256" | "sha512", key: Uint8Array, data: Uint8Array): Uint8Array {
    const hmac = createHmac(algorithm, key);
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

    if (bufA.length !== bufB.length) {
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
