/**
 * @otplib/plugin-base32-rfc
 *
 * Dependency-free Base32 plugin for otplib, implementing RFC 4648.
 * Works universally across all JavaScript runtimes, from both ESM and CommonJS.
 */

import type { Base32EncodeOptions } from "@otplib/core";
import type { Base32Plugin } from "@otplib/core";

/**
 * RFC 4648 Section 6 Base32 alphabet
 */
const RFC4648_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

type Codec = {
  encode(data: Uint8Array): string;
  /** Expects input padded to a multiple of 8 letters. */
  decode(str: string): Uint8Array;
};

/**
 * Create a padded, uppercase RFC 4648 Base32 codec for a 32-letter alphabet
 *
 * Decoding is strict: every input has exactly one valid spelling. It rejects letters outside
 * the alphabet, padding that covers a whole byte, a trailing letter that carries no full byte,
 * and non-zero leftover bits.
 */
function createCodec(alphabet: string): Codec {
  const decodeTable = new Int8Array(128).fill(-1);
  for (let i = 0; i < alphabet.length; i++) {
    decodeTable[alphabet.charCodeAt(i)] = i;
  }

  return {
    encode(data) {
      let encoded = "";
      let buffer = 0;
      let bits = 0;
      for (let i = 0; i < data.length; i++) {
        buffer = ((buffer << 8) | data[i]) & 0xfff;
        bits += 8;
        while (bits >= 5) {
          bits -= 5;
          encoded += alphabet[(buffer >> bits) & 31];
        }
      }
      if (bits > 0) {
        encoded += alphabet[(buffer << (5 - bits)) & 31];
      }
      while (encoded.length % 8 !== 0) {
        encoded += "=";
      }
      return encoded;
    },

    decode(str) {
      let end = str.length;
      for (; end > 0 && str[end - 1] === "="; end--) {
        if (((end - 1) * 5) % 8 === 0) {
          throw new Error("padding: excess padding");
        }
      }

      const decoded = new Uint8Array(Math.floor((end * 5) / 8));
      let buffer = 0;
      let bits = 0;
      let j = 0;
      for (let i = 0; i < end; i++) {
        const code = str.charCodeAt(i);
        const digit = code < 128 ? decodeTable[code] : -1;
        if (digit === -1) {
          throw new Error(`Unknown letter "${str[i]}". Allowed: ${alphabet}`);
        }
        buffer = ((buffer << 5) | digit) & 0xfff;
        bits += 5;
        if (bits >= 8) {
          bits -= 8;
          decoded[j++] = (buffer >> bits) & 0xff;
        }
      }
      if (bits >= 5) {
        throw new Error("Excess padding");
      }
      const leftover = (buffer << (8 - bits)) & 0xff;
      if (leftover > 0) {
        throw new Error(`Non-zero padding: ${leftover}`);
      }
      return decoded;
    },
  };
}

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
