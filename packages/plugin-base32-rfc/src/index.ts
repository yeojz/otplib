/**
 * @otplib/plugin-base32-rfc
 *
 * Dependency-free Base32 plugin for otplib, implementing RFC 4648.
 * Works universally across all JavaScript runtimes, from both ESM and CommonJS.
 */

import { createCodec, RFC4648_ALPHABET } from "./codec.js";

import type { Base32EncodeOptions } from "@otplib/core";
import type { Base32Plugin } from "@otplib/core";

const rfc4648 = createCodec(RFC4648_ALPHABET);

/**
 * RFC 4648 Base32 plugin
 *
 * A dependency-free implementation of the standard RFC 4648 Base32 alphabet (`A-Z2-7`), which
 * authenticator apps use for secrets. It accepts and rejects the same inputs as
 * `ScureBase32Plugin`, and has no ESM-only dependencies, so its CommonJS build loads with
 * `require()` on any runtime.
 *
 * @example
 * ```ts
 * import { Rfc4648Base32Plugin } from '@otplib/plugin-base32-rfc';
 *
 * const plugin = new Rfc4648Base32Plugin();
 * const encoded = plugin.encode(data);
 * const decoded = plugin.decode(encoded);
 * ```
 */
export class Rfc4648Base32Plugin implements Base32Plugin {
  readonly name = "rfc4648";

  /**
   * Encode binary data to Base32 string
   *
   * @param data - Uint8Array to encode
   * @param options - Encoding options
   * @returns Base32 encoded string
   */
  encode(data: Uint8Array, options: Base32EncodeOptions = {}): string {
    const { padding = false } = options;

    const encoded = rfc4648.encode(data);
    return padding ? encoded : encoded.replace(/=+$/, "");
  }

  /**
   * Decode Base32 string to binary data
   *
   * Accepts lowercase input and missing padding.
   *
   * @param str - Base32 string to decode
   * @returns Decoded Uint8Array
   * @throws {Error} If string contains invalid characters
   */
  decode(str: string): Uint8Array {
    try {
      const uppercased = str.toUpperCase();
      const padded = uppercased.padEnd(Math.ceil(uppercased.length / 8) * 8, "=");
      return rfc4648.decode(padded);
    } catch (error) {
      // The codec always throws Error instances; cast keeps the catch branchless.
      throw new Error(`Invalid Base32 string: ${(error as Error).message}`);
    }
  }
}

/**
 * Default singleton instance for convenience
 *
 * @example
 * ```ts
 * import { base32 } from '@otplib/plugin-base32-rfc';
 *
 * const encoded = base32.encode(data);
 * ```
 */
export const base32: Base32Plugin = Object.freeze(new Rfc4648Base32Plugin());

export default Rfc4648Base32Plugin;
