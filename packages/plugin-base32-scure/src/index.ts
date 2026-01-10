/**
 * @otplib/plugin-base32-scure
 *
 * Base32 plugin for otplib using @scure/base.
 * Works universally across all JavaScript runtimes.
 */

import { base32 as scureBase32 } from "@scure/base";

import type { Base32EncodeOptions } from "@otplib/core";
import type { Base32Plugin } from "@otplib/core";

/**
 * Scure Base32 plugin
 *
 * This implementation uses @scure/base for Base32 encoding/decoding.
 * @scure/base is a modern, audited cryptography library with zero dependencies.
 *
 * @example
 * ```ts
 * import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
 *
 * const plugin = new ScureBase32Plugin();
 * const encoded = plugin.encode(data);
 * const decoded = plugin.decode(encoded);
 * ```
 */
export class ScureBase32Plugin implements Base32Plugin {
  readonly name = "scure";

  /**
   * Encode binary data to Base32 string
   *
   * @param data - Uint8Array to encode
   * @param options - Encoding options
   * @returns Base32 encoded string
   */
  encode(data: Uint8Array, options: Base32EncodeOptions = {}): string {
    const { padding = false } = options;

    const encoded = scureBase32.encode(data);
    return padding ? encoded : encoded.replace(/=+$/, "");
  }

  /**
   * Decode Base32 string to binary data
   *
   * @param str - Base32 string to decode
   * @returns Decoded Uint8Array
   * @throws {Error} If string contains invalid characters
   */
  decode(str: string): Uint8Array {
    try {
      const uppercased = str.toUpperCase();
      const padded = uppercased.padEnd(Math.ceil(uppercased.length / 8) * 8, "=");
      return scureBase32.decode(padded);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid Base32 string: ${error.message}`);
      }
      throw new Error("Invalid Base32 string");
    }
  }
}

/**
 * Default singleton instance for convenience
 *
 * @example
 * ```ts
 * import { base32 } from '@otplib/plugin-base32-scure';
 *
 * const encoded = base32.encode(data);
 * ```
 */
export const base32: Base32Plugin = Object.freeze(new ScureBase32Plugin());

export default ScureBase32Plugin;
