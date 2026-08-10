import { constantTimeEqual as constantTimeEqualUtil, normalizeHashAlgorithm } from "@otplib/core";

import type { CryptoPlugin, HashAlgorithm } from "@otplib/core";

/**
 * Web Crypto algorithm name mapping
 *
 * Maps our algorithm names to Web Crypto API algorithm identifiers. The
 * `satisfies` constraint forbids a key outside `HashAlgorithm` and requires
 * every member of it, so this plugin can neither widen the allowlist nor
 * silently skip a newly supported algorithm.
 */
const ALGORITHM_MAP = {
  sha1: "SHA-1",
  sha256: "SHA-256",
  sha512: "SHA-512",
} as const satisfies Record<HashAlgorithm, string>;

/**
 * Algorithms this plugin can compute
 *
 * Derived from the algorithm map rather than written out again, so the
 * declared set cannot disagree with what `hmac` actually handles. Note that
 * SubtleCrypto also implements SHA-384; it is deliberately absent, because
 * RFC 6238 does not include it and no authenticator would verify the result.
 */
const SUPPORTED_ALGORITHMS = Object.keys(ALGORITHM_MAP) as readonly HashAlgorithm[];

/**
 * Get ArrayBuffer from Uint8Array, avoiding copy when possible
 *
 * Only slices when the Uint8Array is a view into a larger buffer.
 * When the array owns its buffer entirely, returns buffer directly.
 */
function getArrayBuffer(arr: Uint8Array): ArrayBuffer {
  if (arr.byteOffset === 0 && arr.byteLength === arr.buffer.byteLength) {
    return arr.buffer as ArrayBuffer;
  }
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

/**
 * Web Crypto API implementation of CryptoPlugin
 *
 * This plugin uses the browser's native Web Crypto API which provides:
 * - Hardware-accelerated cryptographic operations
 * - Secure key storage and generation
 * - Async API for non-blocking operations
 *
 * @example
 * ```ts
 * import { WebCryptoPlugin } from '@otplib/plugin-crypto-web';
 *
 * const crypto = new WebCryptoPlugin();
 * const hmac = await crypto.hmac('sha1', key, data);
 * const random = crypto.randomBytes(20);
 * ```
 */
export class WebCryptoPlugin implements CryptoPlugin {
  /**
   * Plugin name for identification
   */
  readonly name = "web";

  /**
   * Algorithms this plugin can compute
   */
  readonly algorithms = SUPPORTED_ALGORITHMS;

  /**
   * Compute HMAC using Web Crypto API
   *
   * Async implementation using SubtleCrypto.
   *
   * The algorithm is matched ignoring case, with an optional `-` or `_` before
   * the digest size, so `'SHA1'`, `'Sha1'` and Web Crypto's own `'SHA-1'` all
   * resolve to `'sha1'`. Any other digest - including ones SubtleCrypto
   * supports, such as `'SHA-384'` - throws `AlgorithmUnsupportedError`.
   *
   * @param algorithm - Hash algorithm to use
   * @param key - Secret key
   * @param data - Data to authenticate
   * @returns HMAC digest
   * @throws {AlgorithmUnsupportedError} If the algorithm is not supported
   */
  async hmac(algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    const alg = normalizeHashAlgorithm(algorithm, { plugin: this.name });
    const webCrypto = globalThis.crypto;

    if (!webCrypto?.subtle) {
      throw new Error("Web Crypto API is not available in this environment");
    }

    const hashAlgorithm = ALGORITHM_MAP[alg];

    const cryptoKey = await webCrypto.subtle.importKey(
      "raw",
      getArrayBuffer(key),
      { name: "HMAC", hash: hashAlgorithm },
      false,
      ["sign"],
    );

    const signature = await webCrypto.subtle.sign("HMAC", cryptoKey, getArrayBuffer(data));

    return new Uint8Array(signature);
  }

  /**
   * Generate cryptographically secure random bytes
   *
   * Uses Web Crypto API's getRandomValues.
   *
   * @param length - Number of bytes to generate
   * @returns Random bytes
   */
  randomBytes(length: number): Uint8Array {
    const webCrypto = globalThis.crypto;

    if (!webCrypto?.getRandomValues) {
      throw new Error("Web Crypto API getRandomValues is not available in this environment");
    }

    const bytes = new Uint8Array(length);
    webCrypto.getRandomValues(bytes);
    return bytes;
  }

  /**
   * Constant-time comparison to prevent timing side-channel attacks
   *
   * Web Crypto API doesn't provide a built-in constant-time comparison,
   * so we use the core utility implementation.
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
 * import { crypto } from '@otplib/plugin-crypto-web';
 *
 * const hmac = await crypto.hmac('sha1', key, data);
 * ```
 */
export const crypto: CryptoPlugin = Object.freeze(new WebCryptoPlugin());

export default WebCryptoPlugin;
