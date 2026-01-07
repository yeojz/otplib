import type { CryptoPlugin, HashAlgorithm } from "@otplib/core";

/**
 * Web Crypto algorithm name mapping
 *
 * Maps our algorithm names to Web Crypto API algorithm identifiers.
 */
const ALGORITHM_MAP = {
  sha1: "SHA-1",
  sha256: "SHA-256",
  sha512: "SHA-512",
} as const satisfies Record<HashAlgorithm, string>;

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
   * Compute HMAC using Web Crypto API
   *
   * Async implementation using SubtleCrypto.
   *
   * @param algorithm - Hash algorithm to use
   * @param key - Secret key
   * @param data - Data to authenticate
   * @returns HMAC digest
   */
  async hmac(
    algorithm: "sha1" | "sha256" | "sha512",
    key: Uint8Array,
    data: Uint8Array,
  ): Promise<Uint8Array> {
    const webCrypto = globalThis.crypto;

    if (!webCrypto?.subtle) {
      throw new Error("Web Crypto API is not available in this environment");
    }

    const hashAlgorithm = ALGORITHM_MAP[algorithm];

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
