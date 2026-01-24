import { Base32DecodeError, Base32EncodeError } from "./errors.js";
import { constantTimeEqual } from "./utils.js";

import type { Base32EncodeOptions, Base32Plugin, CryptoPlugin, HashAlgorithm } from "./types.js";

/**
 * Options for creating a custom Base32 plugin
 */
export type CreateBase32PluginOptions = {
  /**
   * Plugin name for identification (default: "custom")
   */
  name?: string;

  /**
   * Encode binary data to string
   */
  encode: (data: Uint8Array) => string;

  /**
   * Decode string to binary data
   */
  decode: (str: string) => Uint8Array;
};

/**
 * Options for creating a custom Crypto plugin
 */
export type CreateCryptoPluginOptions = {
  /**
   * Plugin name for identification (default: "custom")
   */
  name?: string;

  /**
   * Compute HMAC using the specified hash algorithm
   */
  hmac: (
    algorithm: HashAlgorithm,
    key: Uint8Array,
    data: Uint8Array,
  ) => Promise<Uint8Array> | Uint8Array;

  /**
   * Generate cryptographically secure random bytes
   */
  randomBytes: (length: number) => Uint8Array;

  /**
   * Constant-time comparison (optional, falls back to core utility)
   */
  constantTimeEqual?: (a: string | Uint8Array, b: string | Uint8Array) => boolean;
};

/**
 * Create a custom Base32 plugin from encode/decode functions
 *
 * Use this factory to create plugins that bypass Base32 encoding
 * or implement custom secret transformations.
 *
 * @example
 * ```ts
 * import { createBase32Plugin, stringToBytes, bytesToString } from '@otplib/core';
 *
 * // UTF-8 string bypass (no Base32)
 * const bypassAsString = createBase32Plugin({
 *   name: 'bypass-as-string',
 *   encode: bytesToString,
 *   decode: stringToBytes,
 * });
 *
 * // Base64 bypass
 * const base64Bypass = createBase32Plugin({
 *   name: 'base64-bypass',
 *   encode: (data) => btoa(String.fromCharCode(...data)),
 *   decode: (str) => new Uint8Array([...atob(str)].map(c => c.charCodeAt(0))),
 * });
 * ```
 */
export function createBase32Plugin(options: CreateBase32PluginOptions): Base32Plugin {
  const { name = "custom", encode, decode } = options;

  return Object.freeze({
    name,
    encode: (data: Uint8Array, _options?: Base32EncodeOptions) => {
      try {
        return encode(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Base32EncodeError(message, { cause: error });
      }
    },
    decode: (str: string) => {
      try {
        return decode(str);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Base32DecodeError(message, { cause: error });
      }
    },
  });
}

/**
 * Create a custom Crypto plugin from crypto operation functions
 *
 * Use this factory when you need a custom cryptographic implementation
 * that doesn't fit the existing plugins (node, web, noble).
 *
 * @example
 * ```ts
 * import { createCryptoPlugin } from '@otplib/core';
 *
 * const customCrypto = createCryptoPlugin({
 *   name: 'my-crypto',
 *   hmac: async (algorithm, key, data) => {
 *     // Custom HMAC implementation
 *   },
 *   randomBytes: (length) => {
 *     // Custom random bytes implementation
 *   },
 * });
 * ```
 */
export function createCryptoPlugin(options: CreateCryptoPluginOptions): CryptoPlugin {
  const { name = "custom", hmac, randomBytes, constantTimeEqual: cte } = options;

  return Object.freeze({
    name,
    hmac,
    randomBytes,
    constantTimeEqual: cte ?? constantTimeEqual,
  });
}
