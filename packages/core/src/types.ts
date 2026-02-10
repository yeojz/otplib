/**
 * Supported hash algorithms for HMAC operations
 */
export type HashAlgorithm = "sha1" | "sha256" | "sha512";

/**
 * Number of characters in the OTP code.
 *
 * Standard TOTP/HOTP uses 6-8 digits. Non-standard variants (e.g., Steam Guard)
 * may use different lengths. Runtime validation is handled by guardrails.
 */
export type Digits = number;

/**
 * Hooks for customizing OTP token encoding and validation.
 *
 * These allow non-standard OTP variants (e.g., Steam Guard) to hook into
 * the generation and verification pipeline, replacing the default numeric
 * encoding with custom schemes without modifying core behavior.
 *
 * When not provided, the standard RFC 4226 numeric encoding is used.
 *
 * @example Steam Guard integration
 * ```typescript
 * import { generate } from '@otplib/totp';
 * import { steam } from '@otplib/community-plugin-steam';
 *
 * const code = await generate({
 *   secret,
 *   crypto,
 *   ...steam, // { digits: 5, hooks: { encodeToken, validateToken } }
 * });
 * ```
 */
export type OTPHooks = {
  /**
   * Custom token encoder. Replaces the default numeric encoding (truncateDigits).
   *
   * Receives the 31-bit truncated HMAC integer and the desired code length,
   * and must return the formatted token string.
   *
   * @param truncatedValue - 31-bit unsigned integer from dynamic truncation
   * @param digits - Desired token length
   * @returns Encoded token string
   */
  readonly encodeToken?: (truncatedValue: number, digits: number) => string;

  /**
   * Custom token validator. Replaces the default digit-only format check.
   *
   * Should throw an error if the token is malformed for this encoding scheme.
   *
   * @param token - Token string to validate
   * @param digits - Expected token length
   * @throws {Error} If token format is invalid
   */
  readonly validateToken?: (token: string, digits: number) => void;

  /**
   * Custom HMAC digest truncation. Replaces the default RFC 4226 dynamic truncation.
   *
   * Receives the raw HMAC digest and must return a 31-bit unsigned integer
   * (0–2,147,483,647). The integer is then passed to `encodeToken` (or the
   * default `truncateDigits`) to produce the final token string.
   *
   * @param hmacResult - Raw HMAC digest as a byte array
   * @returns 31-bit unsigned integer (0 to 0x7FFFFFFF)
   *
   * @example Static truncation (always use first 4 bytes)
   * ```typescript
   * const truncateDigest = (hmac: Uint8Array): number =>
   *   ((hmac[0] & 0x7f) << 24) | (hmac[1] << 16) | (hmac[2] << 8) | hmac[3];
   * ```
   */
  readonly truncateDigest?: (hmacResult: Uint8Array) => number;
};

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

  /**
   * Constant-time comparison to prevent timing side-channel attacks
   *
   * Compares two values in a way that takes constant time regardless of
   * whether they match or differ. This prevents timing attacks where an
   * attacker could determine the secret by measuring comparison time.
   *
   * @param a - First value to compare (string or Uint8Array)
   * @param b - Second value to compare (string or Uint8Array)
   * @returns true if values are equal, false otherwise
   */
  constantTimeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean;
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
