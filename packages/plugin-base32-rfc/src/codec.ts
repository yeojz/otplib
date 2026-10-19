/*!
 * Parts of this file are adapted from @scure/base, Copyright (c) 2022 Paul Miller
 * (https://paulmillr.com), MIT License. See the LICENSE file of @otplib/plugin-base32-rfc.
 */

/**
 * RFC 4648 Base32 codec
 *
 * The decoding checks and their error messages, marked "Adapted from @scure/base" below, follow
 * @scure/base (https://github.com/paulmillr/scure-base), so that this codec accepts and rejects
 * exactly the same inputs as @otplib/plugin-base32-scure.
 */

/**
 * RFC 4648 Section 6 Base32 alphabet
 */
export const RFC4648_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Each Base32 letter carries 5 bits; 8 letters make a block of 5 bytes. */
const BITS_PER_LETTER = 5;
const LETTERS_PER_BLOCK = 8;

export type Codec = {
  /** Encode to uppercase Base32, padded to a whole block. */
  encode(data: Uint8Array): string;
  /** Decode uppercase Base32 that is padded to a whole block. */
  decode(str: string): Uint8Array;
};

/**
 * Map each ASCII character code to its letter's value, or -1 when it isn't in the alphabet
 *
 * Adapted from @scure/base `alphabet()`.
 */
function createDecodeTable(alphabet: string): Int8Array {
  const table = new Int8Array(128).fill(-1);
  for (let i = 0; i < alphabet.length; i++) {
    table[alphabet.charCodeAt(i)] = i;
  }
  return table;
}

/**
 * Remove trailing "=" padding
 *
 * Padding may only fill out the last block, so a "=" that starts a block means a whole block is
 * padding, and is rejected.
 *
 * Adapted from @scure/base `padding().decode`.
 */
function stripPadding(str: string): string {
  let end = str.length;
  while (end > 0 && str[end - 1] === "=") {
    const position = end - 1;
    if (position % LETTERS_PER_BLOCK === 0) {
      throw new Error("padding: excess padding");
    }
    end = position;
  }
  return str.slice(0, end);
}

/**
 * Create a Base32 codec for a 32-letter alphabet
 *
 * Decoding is strict, so every value has exactly one valid spelling: it rejects letters outside
 * the alphabet, padding that fills a whole block, a trailing letter that completes no byte, and
 * non-zero leftover bits.
 */
export function createCodec(alphabet: string): Codec {
  const decodeTable = createDecodeTable(alphabet);

  return {
    encode(data) {
      let encoded = "";
      let buffer = 0;
      let bits = 0;
      for (let i = 0; i < data.length; i++) {
        buffer = ((buffer << 8) | data[i]) & 0xfff;
        bits += 8;
        while (bits >= BITS_PER_LETTER) {
          bits -= BITS_PER_LETTER;
          encoded += alphabet[(buffer >> bits) & 31];
        }
      }
      if (bits > 0) {
        encoded += alphabet[(buffer << (BITS_PER_LETTER - bits)) & 31];
      }
      while (encoded.length % LETTERS_PER_BLOCK !== 0) {
        encoded += "=";
      }
      return encoded;
    },

    decode(str) {
      const letters = stripPadding(str);
      const decoded = new Uint8Array(Math.floor((letters.length * BITS_PER_LETTER) / 8));
      let buffer = 0;
      let bits = 0;
      let j = 0;
      for (let i = 0; i < letters.length; i++) {
        // Adapted from @scure/base `alphabet()`: reject anything outside the alphabet.
        const code = letters.charCodeAt(i);
        const value = code < 128 ? decodeTable[code] : -1;
        if (value === -1) {
          throw new Error(`Unknown letter "${letters[i]}". Allowed: ${alphabet}`);
        }
        buffer = ((buffer << BITS_PER_LETTER) | value) & 0xfff;
        bits += BITS_PER_LETTER;
        if (bits >= 8) {
          bits -= 8;
          decoded[j++] = (buffer >> bits) & 0xff;
        }
      }

      // Adapted from @scure/base `radix2()` decode: the bits left over must be fewer than one
      // letter's worth, and all zero.
      if (bits >= BITS_PER_LETTER) {
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
