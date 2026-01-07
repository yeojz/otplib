/**
 * Supported hash algorithms for HMAC operations
 */
export type HashAlgorithm = "sha1" | "sha256" | "sha512";

/**
 * Supported number of digits for OTP codes
 */
export type Digits = 6 | 7 | 8;

/**
 * Cryptographic plugin type for abstracting HMAC and random byte generation
 * across different runtime environments (Node.js, browser, edge, etc.)
 */
export type CryptoPlugin = {
  /**
   * The name of the crypto plugin (e.g., 'node', 'web', 'js')
   */
  readonly name: string;

  /**
   * Compute HMAC using the specified hash algorithm
   *
   * @param algorithm - The hash algorithm to use
   * @param key - The secret key as a byte array
   * @param data - The data to authenticate as a byte array
   * @returns HMAC digest as a byte array
   */
  hmac(
    algorithm: HashAlgorithm,
    key: Uint8Array,
    data: Uint8Array,
  ): Promise<Uint8Array> | Uint8Array;

  /**
   * Generate cryptographically secure random bytes
   *
   * @param length - Number of random bytes to generate
   * @returns Random bytes
   */
  randomBytes(length: number): Uint8Array;
};

/**
 * Base32 encoding/decoding options
 */
export type Base32EncodeOptions = {
  /**
   * Whether to include padding characters (=)
   * Default: false (Google Authenticator compatible)
   * Note: RFC 4648 specifies padding should be included
   */
  padding?: boolean;
};

/**
 * Base32 plugin type for abstracting Base32 encoding/decoding
 * across different implementations (native, TypeScript, etc.)
 */
export type Base32Plugin = {
  /**
   * The name of the base32 plugin (e.g., 'native', 'ts')
   */
  readonly name: string;

  /**
   * Encode binary data to Base32 string
   *
   * @param data - Uint8Array to encode
   * @param options - Encoding options
   * @returns Base32 encoded string
   */
  encode(data: Uint8Array, options?: Base32EncodeOptions): string;

  /**
   * Decode Base32 string to binary data
   *
   * @param str - Base32 string to decode
   * @returns Decoded Uint8Array
   * @throws {Error} If string contains invalid characters
   */
  decode(str: string): Uint8Array;
};

/**
 * Base options for secret generation
 */
export type SecretOptions = {
  /**
   * Crypto plugin for random byte generation
   */
  readonly crypto: CryptoPlugin;

  /**
   * Base32 plugin for encoding
   */
  readonly base32: Base32Plugin;

  /**
   * Number of random bytes to generate (default: 20)
   * 20 bytes = 160 bits, which provides a good security margin
   */
  readonly length?: number;
};

// ============================================================================
// Result Type for Functional Error Handling
// ============================================================================

/**
 * Success result containing a value
 */
export type OTPResultOk<T> = {
  readonly ok: true;
  readonly value: T;
};

/**
 * Failure result containing an error
 */
export type OTPResultError<E> = {
  readonly ok: false;
  readonly error: E;
};

/**
 * Result type for functional error handling
 *
 * Allows returning errors as values instead of throwing exceptions.
 * Use with `generateSafe()` and `verifySafe()` functions.
 *
 * @example
 * ```typescript
 * const result = await generateSafe({ secret, crypto, base32 });
 * if (result.ok) {
 *   console.log('Token:', result.value);
 * } else {
 *   console.log('Error:', result.error.message);
 * }
 * ```
 */
export type OTPResult<T, E = Error> = OTPResultOk<T> | OTPResultError<E>;
