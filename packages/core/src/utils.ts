import {
  OTPError,
  SecretTooShortError,
  SecretTooLongError,
  CounterNegativeError,
  CounterOverflowError,
  TimeNegativeError,
  PeriodTooSmallError,
  PeriodTooLargeError,
  TokenLengthError,
  TokenFormatError,
  CounterToleranceTooLargeError,
  EpochToleranceNegativeError,
  EpochToleranceTooLargeError,
  CryptoPluginMissingError,
  Base32PluginMissingError,
  SecretMissingError,
  LabelMissingError,
  IssuerMissingError,
  SecretTypeError,
} from "./errors.js";

import type {
  HashAlgorithm,
  SecretOptions,
  OTPResultOk,
  OTPResultError,
  OTPResult,
} from "./types.js";

/**
 * Singleton TextEncoder instance to avoid repeated allocations
 */
const textEncoder = new TextEncoder();

/**
 * Minimum secret length in bytes (128 bits as per RFC 4226)
 */
export const MIN_SECRET_BYTES = 16;

/**
 * Maximum secret length in bytes (512 bits)
 *
 * The 64-byte maximum is not part of the RFCs.
 * This is to prevent excessive memory usage in HMAC operations.
 */
export const MAX_SECRET_BYTES = 64;

/**
 * Recommended secret length in bytes (160 bits as per RFC 4226)
 */
export const RECOMMENDED_SECRET_BYTES = 20;

/**
 * Minimum period in seconds
 */
export const MIN_PERIOD = 1;

/**
 * Maximum period in seconds (1 hour)
 */
export const MAX_PERIOD = 3600;

/**
 * Default period in seconds (30 seconds as per RFC 6238)
 */
export const DEFAULT_PERIOD = 30;

/**
 * Maximum safe integer for counter (2^53 - 1)
 */
export const MAX_COUNTER = Number.MAX_SAFE_INTEGER;

/**
 * Maximum verification window size
 *
 * Limits the number of HMAC computations during verification to prevent DoS attacks.
 * A window of 100 means up to 201 HMAC computations ([-100, +100] range).
 *
 * For TOTP: window=1 is typically sufficient (allows +-30 seconds clock drift)
 * For HOTP: window=10-50 handles reasonable counter desynchronization
 */
export const MAX_WINDOW = 100;

/**
 * Configurable guardrails for OTP validation
 *
 * Allows overriding default safety limits for non-standard production requirements.
 * Use with caution - custom guardrails can weaken security.
 */
export type OTPGuardrails = {
  MIN_SECRET_BYTES: number;
  MAX_SECRET_BYTES: number;
  MIN_PERIOD: number;
  MAX_PERIOD: number;
  MAX_COUNTER: number;
  MAX_WINDOW: number;
};

/**
 * Default guardrails matching RFC recommendations
 *
 * Frozen to ensure immutability. Used as default parameter for validation functions.
 * For custom guardrails, use the createGuardrails() factory function.
 */
const DEFAULT_GUARDRAILS: Readonly<OTPGuardrails> = Object.freeze({
  MIN_SECRET_BYTES,
  MAX_SECRET_BYTES,
  MIN_PERIOD,
  MAX_PERIOD,
  MAX_COUNTER,
  MAX_WINDOW,
});

/**
 * Create guardrails configuration object
 *
 * Factory function that merges custom guardrails with defaults and returns
 * an immutable (frozen) object. No validation is performed on custom values.
 *
 * @param custom - Optional partial guardrails to override defaults
 * @returns Frozen guardrails object
 *
 * @example
 * ```ts
 * import { createGuardrails } from '@otplib/core'
 *
 * const guardrails = createGuardrails({
 *   MIN_SECRET_BYTES: 8,
 *   MAX_WINDOW: 200
 * })
 * ```
 */
export function createGuardrails(custom?: Partial<OTPGuardrails>): Readonly<OTPGuardrails> {
  return Object.freeze({ ...DEFAULT_GUARDRAILS, ...custom });
}

/**
 * Validate secret key
 *
 * @param secret - The secret to validate
 * @param guardrails - Validation guardrails (defaults to RFC recommendations)
 * @throws {SecretTooShortError} If secret is too short
 * @throws {SecretTooLongError} If secret is too long
 */
export function validateSecret(
  secret: Uint8Array,
  guardrails: Readonly<OTPGuardrails> = DEFAULT_GUARDRAILS,
): void {
  if (secret.length < guardrails.MIN_SECRET_BYTES) {
    throw new SecretTooShortError(guardrails.MIN_SECRET_BYTES, secret.length);
  }

  if (secret.length > guardrails.MAX_SECRET_BYTES) {
    throw new SecretTooLongError(guardrails.MAX_SECRET_BYTES, secret.length);
  }
}

/**
 * Validate counter value
 *
 * @param counter - The counter to validate
 * @param guardrails - Validation guardrails (defaults to RFC recommendations)
 * @throws {CounterNegativeError} If counter is negative
 * @throws {CounterOverflowError} If counter exceeds safe integer
 */
export function validateCounter(
  counter: number | bigint,
  guardrails: Readonly<OTPGuardrails> = DEFAULT_GUARDRAILS,
): void {
  const value = typeof counter === "bigint" ? counter : BigInt(counter);

  if (value < 0n) {
    throw new CounterNegativeError();
  }

  if (value > BigInt(guardrails.MAX_COUNTER)) {
    throw new CounterOverflowError();
  }
}

/**
 * Validate time value
 *
 * @param time - The time in seconds to validate
 * @throws {TimeNegativeError} If time is negative
 */
export function validateTime(time: number): void {
  if (time < 0) {
    throw new TimeNegativeError();
  }
}

/**
 * Validate period value
 *
 * @param period - The period in seconds to validate
 * @param guardrails - Validation guardrails (defaults to RFC recommendations)
 * @throws {PeriodTooSmallError} If period is too small
 * @throws {PeriodTooLargeError} If period is too large
 */
export function validatePeriod(
  period: number,
  guardrails: Readonly<OTPGuardrails> = DEFAULT_GUARDRAILS,
): void {
  if (!Number.isInteger(period) || period < guardrails.MIN_PERIOD) {
    throw new PeriodTooSmallError(guardrails.MIN_PERIOD);
  }

  if (period > guardrails.MAX_PERIOD) {
    throw new PeriodTooLargeError(guardrails.MAX_PERIOD);
  }
}

/**
 * Validate token
 *
 * @param token - The token string to validate
 * @param digits - Expected number of digits
 * @throws {TokenLengthError} If token has incorrect length
 * @throws {TokenFormatError} If token contains non-digit characters
 */
export function validateToken(token: string, digits: number): void {
  if (token.length !== digits) {
    throw new TokenLengthError(digits, token.length);
  }

  if (!/^\d+$/.test(token)) {
    throw new TokenFormatError();
  }
}

/**
 * Validate counter tolerance for HOTP verification
 *
 * Prevents DoS attacks by limiting the number of counter values checked.
 *
 * @param counterTolerance - Counter tolerance specification (number or array of offsets)
 * @param guardrails - Validation guardrails (defaults to RFC recommendations)
 * @throws {CounterToleranceTooLargeError} If tolerance size exceeds MAX_WINDOW
 *
 * @example
 * ```ts
 * validateCounterTolerance(1);        // OK: 3 offsets [-1, 0, 1]
 * validateCounterTolerance(100);      // OK: 201 offsets [-100, ..., 100]
 * validateCounterTolerance(101);      // Throws: exceeds MAX_WINDOW
 * validateCounterTolerance([0, 1]);   // OK: 2 offsets
 * ```
 */
export function validateCounterTolerance(
  counterTolerance: number | number[],
  guardrails: Readonly<OTPGuardrails> = DEFAULT_GUARDRAILS,
): void {
  const size = Array.isArray(counterTolerance) ? counterTolerance.length : counterTolerance * 2 + 1;

  if (size > guardrails.MAX_WINDOW * 2 + 1) {
    throw new CounterToleranceTooLargeError(
      guardrails.MAX_WINDOW,
      Array.isArray(counterTolerance) ? counterTolerance.length : counterTolerance,
    );
  }
}

/**
 * Validate epoch tolerance for TOTP verification
 *
 * Prevents DoS attacks by limiting the time range checked.
 * Also validates that tolerance values are non-negative.
 *
 * @param epochTolerance - Epoch tolerance specification (number or tuple [past, future])
 * @param period - The TOTP period in seconds (default: 30). Used to calculate max tolerance.
 * @param guardrails - Validation guardrails (defaults to RFC recommendations)
 * @throws {EpochToleranceNegativeError} If tolerance contains negative values
 * @throws {EpochToleranceTooLargeError} If tolerance exceeds MAX_WINDOW periods
 *
 * @example
 * ```ts
 * validateEpochTolerance(30);            // OK: 30 seconds (default period 30s)
 * validateEpochTolerance([5, 0]);        // OK: 5 seconds past only
 * validateEpochTolerance([-5, 0]);       // Throws: negative values not allowed
 * validateEpochTolerance(3600);          // Throws: exceeds MAX_WINDOW * period
 * validateEpochTolerance(6000, 60);      // OK with 60s period (MAX_WINDOW * 60 = 6000)
 * ```
 */
export function validateEpochTolerance(
  epochTolerance: number | [number, number],
  period: number = DEFAULT_PERIOD,
  guardrails: Readonly<OTPGuardrails> = DEFAULT_GUARDRAILS,
): void {
  const [pastTolerance, futureTolerance] = Array.isArray(epochTolerance)
    ? epochTolerance
    : [epochTolerance, epochTolerance];

  // Check for negative values
  if (pastTolerance < 0 || futureTolerance < 0) {
    throw new EpochToleranceNegativeError();
  }

  // Check total tolerance doesn't exceed reasonable limits
  // Convert to periods and check against MAX_WINDOW
  const maxToleranceSeconds = guardrails.MAX_WINDOW * period;
  const maxAllowed = Math.max(pastTolerance, futureTolerance);

  if (maxAllowed > maxToleranceSeconds) {
    throw new EpochToleranceTooLargeError(maxToleranceSeconds, maxAllowed);
  }
}

/**
 * Convert counter to 8-byte big-endian array
 *
 * Per RFC 4226 Section 5.1, the counter value is represented as an 8-byte
 * big-endian (network byte order) unsigned integer.
 *
 * @see {@link https://tools.ietf.org/html/rfc4226#section-5.1 | RFC 4226 Section 5.1 - Symbol Descriptions}
 *
 * @param value - The counter value to convert
 * @returns 8-byte big-endian array
 */
export function counterToBytes(value: number | bigint): Uint8Array {
  const bigintValue = typeof value === "bigint" ? value : BigInt(value);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);

  view.setBigUint64(0, bigintValue, false);

  return new Uint8Array(buffer);
}

/**
 * Perform Dynamic Truncation as per RFC 4226 Section 5.3
 *
 * The algorithm:
 * 1. Take the low-order 4 bits of the last byte as offset
 * 2. Extract 4 bytes starting at offset
 * 3. Mask the most significant bit to get a 31-bit unsigned integer
 *
 * This ensures consistent extraction across different HMAC output sizes
 * while producing a value that fits in a signed 32-bit integer.
 *
 * @see {@link https://tools.ietf.org/html/rfc4226#section-5.3 | RFC 4226 Section 5.3 - Generating an HOTP Value}
 *
 * @param hmacResult - HMAC result (at least 20 bytes for SHA-1)
 * @returns Truncated 31-bit unsigned integer
 */
export function dynamicTruncate(hmacResult: Uint8Array): number {
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;

  const binary =
    ((hmacResult[offset] & 0x7f) << 24) |
    (hmacResult[offset + 1] << 16) |
    (hmacResult[offset + 2] << 8) |
    hmacResult[offset + 3];

  return binary;
}

/**
 * Convert truncated integer to OTP string with specified digits
 *
 * Computes: Snum mod 10^Digit (RFC 4226 Section 5.3)
 *
 * The result is zero-padded to ensure consistent length,
 * as required for proper token comparison.
 *
 * @see {@link https://tools.ietf.org/html/rfc4226#section-5.3 | RFC 4226 Section 5.3 - Generating an HOTP Value}
 *
 * @param value - The truncated integer value (Snum)
 * @param digits - Number of digits for the OTP (Digit, typically 6-8)
 * @returns OTP string with leading zeros if necessary
 */
export function truncateDigits(value: number, digits: number): string {
  const maxOtp = 10 ** digits;
  const otp = value % maxOtp;
  return otp.toString().padStart(digits, "0");
}

/**
 * Validate that two byte arrays have equal length
 *
 * Useful as a preliminary check before performing byte-by-byte comparisons.
 *
 * @param a - First byte array
 * @param b - Second byte array
 * @returns true if arrays have equal length, false otherwise
 */
export function validateByteLengthEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length;
}

/**
 * Constant-time comparison to prevent timing attacks
 *
 * This implements a timing-safe equality check as recommended in
 * RFC 4226 Section 7.2 for token validation to prevent
 * timing side-channel attacks.
 *
 * @see {@link https://tools.ietf.org/html/rfc4226#section-7.2 | RFC 4226 Section 7.2 - Validation and Verification}
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if values are equal, false otherwise
 */
export function constantTimeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean {
  const bufA = stringToBytes(a);
  const bufB = stringToBytes(b);

  if (!validateByteLengthEqual(bufA, bufB)) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }

  return result === 0;
}

/**
 * Get HMAC digest size in bytes for a given algorithm
 *
 * @param algorithm - The hash algorithm
 * @returns Digest size in bytes
 */
export function getDigestSize(algorithm: HashAlgorithm): number {
  switch (algorithm) {
    case "sha1":
      return 20;
    case "sha256":
      return 32;
    case "sha512":
      return 64;
  }
}

/**
 * Convert a string or Uint8Array to Uint8Array
 *
 * This utility function normalizes input to Uint8Array, converting strings
 * using UTF-8 encoding. Uint8Array inputs are returned as-is.
 *
 * @param value - The value to convert (string or Uint8Array)
 * @returns The value as a Uint8Array (UTF-8 encoded for strings)
 *
 * @example
 * ```ts
 * import { stringToBytes } from '@otplib/core'
 *
 * const bytes1 = stringToBytes('1234567890123456')
 * // Returns: Uint8Array([49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 49, 50, 51, 52, 53, 54])
 *
 * const bytes2 = stringToBytes(new Uint8Array([1, 2, 3]))
 * // Returns: Uint8Array([1, 2, 3]) - returned as-is
 * ```
 */
export function stringToBytes(value: string | Uint8Array): Uint8Array {
  return typeof value === "string" ? textEncoder.encode(value) : value;
}

/**
 * Convert a hex string to a Uint8Array
 *
 * This is useful for working with RFC test vectors and debugging HMAC outputs,
 * which are commonly represented as hexadecimal strings.
 *
 * If your environment supports it, consider using `Uint8Array.fromHex()` instead.
 *
 * @param hex - The hex string to convert (lowercase or uppercase, no 0x prefix)
 * @returns The bytes as a Uint8Array
 *
 * @example
 * ```ts
 * import { hexToBytes } from '@otplib/core'
 *
 * // Convert RFC 4226 HMAC test vector
 * const hmac = hexToBytes('cc93cf18508d94934c64b65d8ba7667fb7cde4b0')
 * // Returns: Uint8Array([0xcc, 0x93, 0xcf, ...])
 * ```
 */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Normalize secret input to Uint8Array
 *
 * Accepts either a Base32-encoded string or Uint8Array and returns Uint8Array.
 * If a Base32Plugin is provided, string secrets will be automatically decoded.
 *
 * @param secret - The secret to normalize (string or Uint8Array)
 * @param base32 - Optional Base32Plugin to decode string secrets
 * @returns The secret as Uint8Array
 * @throws {Error} If secret is a string but no Base32Plugin is provided
 *
 * @example
 * ```ts
 * import { normalizeSecret } from '@otplib/core'
 * import { ScureBase32Plugin } from '@otplib/plugin-base32-scure'
 *
 * const base32 = new ScureBase32Plugin()
 *
 * // Uint8Array - returned as-is
 * const secret1 = normalizeSecret(new Uint8Array([1, 2, 3]))
 *
 * // Base32 string - automatically decoded
 * const secret2 = normalizeSecret('JBSWY3DPEHPK3PXP', base32)
 * ```
 */
export function normalizeSecret(
  secret: string | Uint8Array,
  base32?: { decode: (str: string) => Uint8Array },
): Uint8Array {
  if (typeof secret === "string") {
    if (!base32) {
      throw new Error("String secrets require a Base32Plugin. Please provide a base32 parameter.");
    }
    return base32.decode(secret);
  }
  return secret;
}

/**
 * Generate a random Base32-encoded secret
 *
 * Creates a cryptographically secure random secret suitable for OTP generation.
 * The default length of 20 bytes (160 bits) matches RFC 4226 recommendations
 * and provides good security margin.
 *
 * @param options - Secret generation options
 * @returns Base32-encoded secret string (without padding for Google Authenticator compatibility)
 *
 * @example
 * ```ts
 * import { generateSecret } from '@otplib/core';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 * import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
 *
 * const secret = generateSecret({
 *   crypto: new NodeCryptoPlugin(),
 *   base32: new ScureBase32Plugin(),
 * });
 * // Returns: 'JBSWY3DPEHPK3PXP...' (32 characters)
 * ```
 *
 * @example Custom length
 * ```ts
 * const secret = generateSecret({
 *   crypto: new NodeCryptoPlugin(),
 *   base32: new ScureBase32Plugin(),
 *   length: 32, // 256 bits for SHA-256
 * });
 * ```
 */
export function generateSecret(options: SecretOptions): string {
  const { crypto, base32, length = RECOMMENDED_SECRET_BYTES } = options;

  const randomBytes = crypto.randomBytes(length);
  return base32.encode(randomBytes, { padding: false });
}

/**
 * Normalize counter tolerance to an array of offsets
 *
 * Converts a number or array counter tolerance specification into an array of offsets
 * - Number: creates symmetric range [-tolerance, +tolerance]
 * - Array: uses the array as-is (already contains specific offsets)
 *
 * @param counterTolerance - Counter tolerance specification (number or array of offsets)
 * @returns Array of offsets to check
 *
 * @example
 * ```ts
 * normalizeCounterTolerance(0)  // [0]
 * normalizeCounterTolerance(1)  // [-1, 0, 1]
 * normalizeCounterTolerance(2)  // [-2, -1, 0, 1, 2]
 * normalizeCounterTolerance([0, 1])  // [0, 1]
 * normalizeCounterTolerance([-1, 0, 1])  // [-1, 0, 1]
 * ```
 */
export function normalizeCounterTolerance(counterTolerance: number | number[] = 0): number[] {
  if (Array.isArray(counterTolerance)) {
    return counterTolerance;
  }

  const result: number[] = [];
  for (let i = -counterTolerance; i <= counterTolerance; i++) {
    // Bitwise OR with 0 converts -0 to 0 and preserves other integers
    result.push(i | 0);
  }
  return result;
}

/**
 * Normalize epoch tolerance to [past, future] tuple
 *
 * Converts a number or tuple epoch tolerance specification into a [past, future] tuple
 * - Number: creates symmetric tolerance [tolerance, tolerance]
 * - Tuple: uses the tuple as-is
 *
 * @param epochTolerance - Epoch tolerance specification (number or tuple [past, future])
 * @returns Tuple [pastTolerance, futureTolerance] in seconds
 *
 * @example
 * ```ts
 * normalizeEpochTolerance(0)        // [0, 0]
 * normalizeEpochTolerance(30)       // [30, 30]
 * normalizeEpochTolerance([5, 0])   // [5, 0]
 * normalizeEpochTolerance([10, 5])  // [10, 5]
 * ```
 */
export function normalizeEpochTolerance(
  epochTolerance: number | [number, number] = 0,
): [number, number] {
  return Array.isArray(epochTolerance) ? epochTolerance : [epochTolerance, epochTolerance];
}

/**
 * Require crypto plugin to be configured
 *
 * @param crypto - The crypto plugin
 * @throws {CryptoPluginMissingError} If crypto plugin is not set
 */
export function requireCryptoPlugin<T>(crypto: T | undefined): asserts crypto is T {
  if (!crypto) {
    throw new CryptoPluginMissingError();
  }
}

/**
 * Require Base32 plugin to be configured
 *
 * @param base32 - The Base32 plugin
 * @throws {Base32PluginMissingError} If Base32 plugin is not set
 */
export function requireBase32Plugin<T>(base32: T | undefined): asserts base32 is T {
  if (!base32) {
    throw new Base32PluginMissingError();
  }
}

/**
 * Require secret to be configured
 *
 * @param secret - The secret value
 * @throws {SecretMissingError} If secret is not set
 */
export function requireSecret<T>(secret: T | undefined): asserts secret is T {
  if (!secret) {
    throw new SecretMissingError();
  }
}

/**
 * Require label to be configured (for URI generation)
 *
 * @param label - The label value
 * @throws {LabelMissingError} If label is not set
 */
export function requireLabel(label: string | undefined): asserts label is string {
  if (!label) {
    throw new LabelMissingError();
  }
}

/**
 * Require issuer to be configured (for URI generation)
 *
 * @param issuer - The issuer value
 * @throws {IssuerMissingError} If issuer is not set
 */
export function requireIssuer(issuer: string | undefined): asserts issuer is string {
  if (!issuer) {
    throw new IssuerMissingError();
  }
}

/**
 * Require secret to be a Base32 string (for URI generation)
 *
 * @param secret - The secret value
 * @throws {SecretTypeError} If secret is not a string
 */
export function requireBase32String(secret: string | Uint8Array): asserts secret is string {
  if (typeof secret !== "string") {
    throw new SecretTypeError();
  }
}

/**
 * Create a success result
 * @internal
 */
function ok<T>(value: T): OTPResultOk<T> {
  return { ok: true, value };
}

/**
 * Create a failure result
 * @internal
 */
function err<E>(error: E): OTPResultError<E> {
  return { ok: false, error };
}

/**
 * Wrap a synchronous function to return OTPResult instead of throwing
 *
 * Preserves the original OTPError subclass so users can access
 * specific error information via instanceof checks.
 *
 * @internal
 */
export function wrapResult<T, Args extends unknown[]>(
  fn: (...args: Args) => T,
): (...args: Args) => OTPResult<T, OTPError> {
  return (...args: Args): OTPResult<T, OTPError> => {
    try {
      return ok(fn(...args));
    } catch (error) {
      return err(error as OTPError);
    }
  };
}

/**
 * Wrap an async function to return OTPResult instead of throwing
 *
 * Preserves the original OTPError subclass so users can access
 * specific error information via instanceof checks.
 *
 * @internal
 */
export function wrapResultAsync<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
): (...args: Args) => Promise<OTPResult<T, OTPError>> {
  return async (...args: Args): Promise<OTPResult<T, OTPError>> => {
    try {
      return ok(await fn(...args));
    } catch (error) {
      return err(error as OTPError);
    }
  };
}
