import { Base32EncodeError, Base32DecodeError } from "./errors.js";

import type { Base32Plugin, Base32EncodeOptions } from "./types.js";

/**
 * Base32Context provides a unified interface for Base32 operations
 * using a pluggable Base32 backend.
 *
 * All errors from the underlying plugin are wrapped in otplib error types
 * with the original error preserved via the `cause` property.
 */
export class Base32Context {
  /**
   * Create a new Base32Context with the given Base32 plugin
   *
   * @param base32 - The Base32 plugin to use
   */
  constructor(private readonly base32: Base32Plugin) {}

  /**
   * Get the underlying Base32 plugin
   */
  get plugin(): Base32Plugin {
    return this.base32;
  }

  /**
   * Encode binary data to Base32 string using the configured plugin
   *
   * @param data - Uint8Array to encode
   * @param options - Encoding options
   * @returns Base32 encoded string
   * @throws {Base32EncodeError} If encoding fails
   */
  encode(data: Uint8Array, options?: Base32EncodeOptions): string {
    try {
      return this.base32.encode(data, options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Base32EncodeError(message, { cause: error });
    }
  }

  /**
   * Decode Base32 string to binary data using the configured plugin
   *
   * @param str - Base32 string to decode
   * @returns Decoded Uint8Array
   * @throws {Base32DecodeError} If string contains invalid characters or decoding fails
   */
  decode(str: string): Uint8Array {
    try {
      return this.base32.decode(str);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Base32DecodeError(message, { cause: error });
    }
  }
}

/**
 * Create a Base32Context from a Base32 plugin
 *
 * @param base32 - The Base32 plugin to use
 * @returns A new Base32Context instance
 */
export function createBase32Context(base32: Base32Plugin): Base32Context {
  return new Base32Context(base32);
}
