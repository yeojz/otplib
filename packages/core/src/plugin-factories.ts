import { Base32DecodeError, Base32EncodeError } from "./errors.js";
import { constantTimeEqual, normalizeHashAlgorithm } from "./utils.js";

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
   * The algorithms this plugin can compute, when it supports fewer than all of
   * {@link HASH_ALGORITHMS}
   *
   * Omit it unless the backing implementation is genuinely restricted - an
   * absent value means the full set. Declaring it is enforced, not advisory:
   * the factory rejects an undeclared algorithm before `hmac` is called, so the
   * implementation below never sees a value it cannot handle.
   *
   * This can only narrow. The value is intersected with `HASH_ALGORITHMS`, so
   * listing a digest outside that set does not enable it.
   */
  algorithms?: readonly HashAlgorithm[];

  /**
   * Compute HMAC using the specified hash algorithm
   *
   * Receives the canonical lowercase name, already checked against
   * `algorithms` - no validation is needed here.
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
 * The returned plugin validates the algorithm before delegating, so `hmac`
 * receives the canonical lowercase name and never has to guess at an
 * unrecognised one. A plugin declaring `algorithms` is held to that
 * declaration: anything outside it throws `AlgorithmUnsupportedError`, whether
 * the plugin is called directly or through `CryptoContext`.
 *
 * @example
 * ```ts
 * import { createCryptoPlugin } from '@otplib/core';
 *
 * const customCrypto = createCryptoPlugin({
 *   name: 'my-crypto',
 *   hmac: async (algorithm, key, data) => {
 *     // Custom HMAC implementation - `algorithm` is already validated
 *   },
 *   randomBytes: (length) => {
 *     // Custom random bytes implementation
 *   },
 * });
 *
 * // A plugin backed by a restricted implementation
 * const sha1Only = createCryptoPlugin({
 *   name: 'sha1-only',
 *   algorithms: ['sha1'],
 *   hmac: (algorithm, key, data) => computeSha1Hmac(key, data),
 *   randomBytes: (length) => crypto.getRandomValues(new Uint8Array(length)),
 * });
 *
 * sha1Only.hmac('sha256', key, data); // throws AlgorithmUnsupportedError
 * ```
 */
export function createCryptoPlugin(options: CreateCryptoPluginOptions): CryptoPlugin {
  const { name = "custom", algorithms, hmac, randomBytes, constantTimeEqual: cte } = options;

  // Copied and frozen, never held by reference. `readonly` is erased at compile
  // time, so retaining the caller's array would let them push to it after
  // construction and broaden a restricted plugin's capability - and the copy is
  // what both the declaration and the check below read, so the two cannot
  // diverge.
  const supportedAlgorithms = algorithms ? Object.freeze([...algorithms]) : undefined;

  return Object.freeze({
    name,
    ...(supportedAlgorithms ? { algorithms: supportedAlgorithms } : {}),
    hmac: (algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array) =>
      hmac(
        normalizeHashAlgorithm(algorithm, { supported: supportedAlgorithms, plugin: name }),
        key,
        data,
      ),
    randomBytes,
    constantTimeEqual: cte ?? constantTimeEqual,
  });
}
