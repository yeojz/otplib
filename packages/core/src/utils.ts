import {
  OTPError,
  SecretTooShortError,
  SecretTooLongError,
  CounterNegativeError,
  CounterOverflowError,
  CounterNotIntegerError,
  TimeNegativeError,
  TimeNotFiniteError,
  PeriodTooSmallError,
  PeriodTooLargeError,
  DigitsError,
  AlgorithmError,
  TokenLengthError,
  TokenFormatError,
  CounterToleranceError,
  CounterToleranceTooLargeError,
  CounterToleranceNegativeError,
  EpochToleranceError,
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
 * Singleton TextDecoder instance to avoid repeated allocations
 */
const textDecoder = new TextDecoder();

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
 * A window of 99 means up to 99 HMAC computations (total checks including current counter).
 * Odd number to cater for equal distribution of time drift + current.
 *
 * For TOTP: window=1 is typically sufficient (allows +-30 seconds clock drift)
 * For HOTP: window=10-50 handles reasonable counter desynchronization
 */
export const MAX_WINDOW = 99;

/**
 * Configurable guardrails for OTP validation
 *
 * Allows overriding default safety limits for non-standard production requirements.
 * Use with caution - custom guardrails can weaken security.
 */
export type OTPGuardrailsConfig = {
  MIN_SECRET_BYTES: number;
  MAX_SECRET_BYTES: number;
  MIN_PERIOD: number;
  MAX_PERIOD: number;
  MAX_COUNTER: number;
  MAX_WINDOW: number;
};

/**
 * Module-private symbol to track guardrail override status
 *
 * This symbol is used as a property key to store whether guardrails contain custom values.
 * Being module-private and a symbol ensures:
 * - Cannot be accessed outside this module (not exported)
 * - Cannot be recreated (each Symbol() call is unique)
 * - Hidden from normal enumeration (Object.keys, JSON.stringify, for-in)
 * - Minimal memory overhead (~1 byte per object)
 * - No garbage collection concerns
 *
 * @internal
 */
const OVERRIDE_SYMBOL = Symbol("otplib.guardrails.override");

/**
 * Complete guardrails configuration
 *
 * This represents the final, immutable configuration used by validation functions.
 * Internally tracks whether any values were overridden from RFC recommendations,
 * enabling security auditing and compliance monitoring without exposing implementation
 * details in the public API.
 *
 * The override status is stored using a module-private Symbol that cannot be accessed
 * or recreated outside this module, providing true encapsulation.
 *
 * @see {@link OTPGuardrailsConfig} for the base configuration structure
 * @see {@link createGuardrails} for creating guardrails instances
 * @see {@link hasGuardrailOverrides} to check if guardrails were customized
 */
export type OTPGuardrails = Readonly<OTPGuardrailsConfig> & {
  [OVERRIDE_SYMBOL]?: boolean;
};

/**
 * Validate guardrail numeric field
 */
function assertGuardrailSafeInteger(name: string, value: unknown): asserts value is number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error(`Guardrail '${name}' must be a safe integer`);
  }
}

/**
 * Default guardrails matching RFC recommendations
 *
 * Frozen to ensure immutability. Used as default parameter for validation functions.
 * For custom guardrails, use the createGuardrails() factory function.
 */
const DEFAULT_GUARDRAILS: OTPGuardrails = Object.freeze({
  MIN_SECRET_BYTES,
  MAX_SECRET_BYTES,
  MIN_PERIOD,
  MAX_PERIOD,
  MAX_COUNTER,
  MAX_WINDOW,
  [OVERRIDE_SYMBOL]: false,
});

/**
 * Create guardrails configuration object
 *
 * Factory function that merges custom guardrails with defaults and returns
 * an immutable (frozen) object. Validates custom guardrails to ensure they
 * maintain basic safety invariants.
 *
 * When called without arguments or with `undefined`, returns the default guardrails
 * singleton (optimized to avoid unnecessary allocations). When called with custom
 * values, creates a new frozen object and internally marks it as overridden.
 *
 * @param custom - Optional partial guardrails to override defaults
 * @returns Frozen guardrails object
 * @throws {Error} If custom guardrails violate safety invariants
 *
 * @example Basic usage
 * ```ts
 * import { createGuardrails, hasGuardrailOverrides } from '@otplib/core'
 *
 * // Returns default singleton (no overrides)
 * const defaults = createGuardrails();
 * hasGuardrailOverrides(defaults); // false
 *
 * // Creates new object with overrides
 * const custom = createGuardrails({
 *   MIN_SECRET_BYTES: 8,
 *   MAX_WINDOW: 200
 * });
 * hasGuardrailOverrides(custom); // true
 * ```
 *
 * @example Monitoring custom guardrails
 * ```ts
 * import { createGuardrails, hasGuardrailOverrides } from '@otplib/core';
 *
 * const guardrails = createGuardrails({ MAX_WINDOW: 20 });
 *
 * if (hasGuardrailOverrides(guardrails)) {
 *   logger.warn('Non-default guardrails in use', { guardrails });
 * }
 * ```
 *
 * @see {@link hasGuardrailOverrides} to check if guardrails were customized
 */
export function createGuardrails(custom?: Partial<OTPGuardrailsConfig>): OTPGuardrails {
  if (!custom) {
    return DEFAULT_GUARDRAILS;
  }

  if (custom.MIN_SECRET_BYTES !== undefined) {
    assertGuardrailSafeInteger("MIN_SECRET_BYTES", custom.MIN_SECRET_BYTES);
    if (custom.MIN_SECRET_BYTES < 1) {
      throw new Error("Guardrail 'MIN_SECRET_BYTES' must be >= 1");
    }
  }

  if (custom.MAX_SECRET_BYTES !== undefined) {
    assertGuardrailSafeInteger("MAX_SECRET_BYTES", custom.MAX_SECRET_BYTES);
    if (custom.MAX_SECRET_BYTES < 1) {
      throw new Error("Guardrail 'MAX_SECRET_BYTES' must be >= 1");
    }
  }

  if (custom.MIN_PERIOD !== undefined) {
    assertGuardrailSafeInteger("MIN_PERIOD", custom.MIN_PERIOD);
    if (custom.MIN_PERIOD < 1) {
      throw new Error("Guardrail 'MIN_PERIOD' must be >= 1");
    }
  }

  if (custom.MAX_PERIOD !== undefined) {
    assertGuardrailSafeInteger("MAX_PERIOD", custom.MAX_PERIOD);
    if (custom.MAX_PERIOD < 1) {
      throw new Error("Guardrail 'MAX_PERIOD' must be >= 1");
    }
  }

  if (custom.MAX_COUNTER !== undefined) {
    assertGuardrailSafeInteger("MAX_COUNTER", custom.MAX_COUNTER);
    if (custom.MAX_COUNTER < 0) {
      throw new Error("Guardrail 'MAX_COUNTER' must be >= 0");
    }
  }

  if (custom.MAX_WINDOW !== undefined) {
    assertGuardrailSafeInteger("MAX_WINDOW", custom.MAX_WINDOW);
    if (custom.MAX_WINDOW < 1) {
      throw new Error("Guardrail 'MAX_WINDOW' must be >= 1");
    }
  }

  const merged = {
    ...DEFAULT_GUARDRAILS,
    ...custom,
  };

  if (merged.MIN_SECRET_BYTES > merged.MAX_SECRET_BYTES) {
    throw new Error("Guardrail 'MIN_SECRET_BYTES' must be <= 'MAX_SECRET_BYTES'");
  }

  if (merged.MIN_PERIOD > merged.MAX_PERIOD) {
    throw new Error("Guardrail 'MIN_PERIOD' must be <= 'MAX_PERIOD'");
  }

  return Object.freeze({
    ...merged,
    [OVERRIDE_SYMBOL]: true,
  });
}

/**
 * Check if guardrails contain custom overrides
 *
 * Returns `true` if the guardrails object was created with custom values,
 * `false` if using RFC-recommended defaults. Useful for security auditing,
 * compliance monitoring, and development warnings.
 *
 * This function accesses a module-private Symbol property that cannot be
 * accessed or modified outside this module, ensuring reliable detection.
 *
 * @param guardrails - The guardrails object to check
 * @returns `true` if guardrails were customized, `false` if using defaults
 *
 * @example Security monitoring
 * ```ts
 * import { createGuardrails, hasGuardrailOverrides } from '@otplib/core';
 *
 * const guardrails = createGuardrails({ MAX_WINDOW: 20 });
 *
 * if (hasGuardrailOverrides(guardrails)) {
 *   console.warn('Custom guardrails detected:', guardrails);
 *   // Log to security audit system
 * }
 * ```
 *
 * @example Compliance check
 * ```ts
 * function validateGuardrails(guardrails: OTPGuardrails) {
 *   if (hasGuardrailOverrides(guardrails)) {
 *     throw new Error('Custom guardrails not allowed in production');
 *   }
 * }
 * ```
 */
export function hasGuardrailOverrides(guardrails: OTPGuardrails): boolean {
  return guardrails[OVERRIDE_SYMBOL] ?? false;
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
  guardrails: OTPGuardrails = DEFAULT_GUARDRAILS,
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
  guardrails: OTPGuardrails = DEFAULT_GUARDRAILS,
): void {
  if (typeof counter === "number" && (!Number.isFinite(counter) || !Number.isInteger(counter))) {
    throw new CounterNotIntegerError();
  }

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
  if (!Number.isFinite(time)) {
    throw new TimeNotFiniteError();
  }

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
  guardrails: OTPGuardrails = DEFAULT_GUARDRAILS,
): void {
  if (!Number.isInteger(period) || period < guardrails.MIN_PERIOD) {
    throw new PeriodTooSmallError(guardrails.MIN_PERIOD);
  }

  if (period > guardrails.MAX_PERIOD) {
    throw new PeriodTooLargeError(guardrails.MAX_PERIOD);
  }
}

/**
 * Validate digits value
 *
 * @param digits - Number of digits for OTP
 * @throws {DigitsError} If digits is not 6, 7, or 8
 */
export function validateDigits(digits: number): void {
  if (digits !== 6 && digits !== 7 && digits !== 8) {
    throw new DigitsError(`Digits must be 6, 7, or 8, got ${digits}`);
  }
}

/**
 * Validate hash algorithm
 *
 * @param algorithm - Hash algorithm
 * @throws {AlgorithmError} If algorithm is unsupported
 */
export function validateAlgorithm(algorithm: string): asserts algorithm is HashAlgorithm {
  if (algorithm !== "sha1" && algorithm !== "sha256" && algorithm !== "sha512") {
    throw new AlgorithmError(
      `Algorithm must be one of 'sha1', 'sha256', or 'sha512', got '${algorithm}'`,
    );
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
 * validateCounterTolerance(1);        // OK: [0, 1] = 2 checks
 * validateCounterTolerance(98);       // OK: [0, 98] = 99 checks
 * validateCounterTolerance(99);       // Throws: exceeds MAX_WINDOW
 * validateCounterTolerance([0, 1]);   // OK: 2 offsets
 * ```
 */
export function validateCounterTolerance(
  counterTolerance: number | [number, number],
  guardrails: OTPGuardrails = DEFAULT_GUARDRAILS,
): void {
  const [past, future] = normalizeCounterTolerance(counterTolerance);

  if (!Number.isSafeInteger(past) || !Number.isSafeInteger(future)) {
    throw new CounterToleranceError("Counter tolerance values must be safe integers");
  }

  if (past < 0 || future < 0) {
    throw new CounterToleranceNegativeError();
  }

  const totalChecks = past + future + 1;

  if (totalChecks > guardrails.MAX_WINDOW) {
    throw new CounterToleranceTooLargeError(guardrails.MAX_WINDOW, totalChecks);
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
 * validateEpochTolerance(30);            // OK: 30 seconds symmetric
 * validateEpochTolerance([5, 0]);        // OK: 5 seconds past only
 * validateEpochTolerance([-5, 0]);       // Throws: negative values not allowed
 * validateEpochTolerance(1471);          // Throws with default guardrails (30s period)
 * validateEpochTolerance(2940, 60);      // OK with 60s period
 * ```
 */
export function validateEpochTolerance(
  epochTolerance: number | [number, number],
  period: number = DEFAULT_PERIOD,
  guardrails: OTPGuardrails = DEFAULT_GUARDRAILS,
): void {
  const [pastTolerance, futureTolerance] = Array.isArray(epochTolerance)
    ? epochTolerance
    : [epochTolerance, epochTolerance];

  if (!Number.isSafeInteger(pastTolerance) || !Number.isSafeInteger(futureTolerance)) {
    throw new EpochToleranceError("Epoch tolerance values must be safe integers");
  }

  // Check for negative values
  if (pastTolerance < 0 || futureTolerance < 0) {
    throw new EpochToleranceNegativeError();
  }

  // Per-side tolerance cannot exceed the max representable range.
  // MAX_WINDOW checks means at most MAX_WINDOW - 1 periods of tolerance.
  const maxToleranceSeconds = (guardrails.MAX_WINDOW - 1) * period;
  const maxAllowed = Math.max(pastTolerance, futureTolerance);

  if (maxAllowed > maxToleranceSeconds) {
    throw new EpochToleranceTooLargeError(maxToleranceSeconds, maxAllowed);
  }

  // Aggregate tolerance must stay within the configured verification window.
  // This prevents large bidirectional windows that can trigger excessive HMAC checks.
  const totalToleranceSeconds = pastTolerance + futureTolerance;
  if (totalToleranceSeconds > maxToleranceSeconds) {
    throw new EpochToleranceTooLargeError(maxToleranceSeconds, totalToleranceSeconds);
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
 * Use this to convert raw secret strings (passphrases) to Uint8Array
 * before passing them to generation or verification functions.
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
 * Convert bytes to UTF-8 string
 *
 * Uses TextDecoder for proper UTF-8 handling.
 *
 * @param bytes - Uint8Array to convert
 * @returns UTF-8 string
 *
 * @example
 * ```ts
 * const str = bytesToString(new Uint8Array([104, 101, 108, 108, 111]));
 * // str === "hello"
 * ```
 */
export function bytesToString(bytes: Uint8Array): string {
  return textDecoder.decode(bytes);
}

/**
 * Normalize secret input to Uint8Array
 *
 * Accepts either a Base32-encoded string or Uint8Array and returns Uint8Array.
 * If a Base32Plugin is provided, string secrets will be automatically decoded.
 *
 * **Note**: By default, strings are assumed to be Base32 encoded.
 * If you have a raw string secret (e.g. a passphrase), you must convert it
 * to a Uint8Array using {@link stringToBytes} before calling this function.
 *
 * @param secret - The secret to normalize (Base32 string or Uint8Array)
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
    requireBase32Plugin(base32);
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

  requireCryptoPlugin(crypto);
  requireBase32Plugin(base32);

  const randomBytes = crypto.randomBytes(length);
  return base32.encode(randomBytes, { padding: false });
}

/**
 * Normalize counter tolerance to [past, future] tuple
 *
 * Converts a number or tuple counter tolerance specification into a [past, future] tuple
 * - Number: creates look-ahead only tolerance [0, tolerance] (default for security)
 * - Tuple: uses the tuple as-is (past, future)
 *
 * The default behavior (number → look-ahead only) improves security by preventing
 * replay attacks. HOTP counters should only move forward in normal operation.
 *
 * @param counterTolerance - Counter tolerance specification (number or tuple [past, future])
 * @returns Tuple [past, future] representing counters to check
 *
 * @example
 * ```ts
 * normalizeCounterTolerance(0)        // [0, 0]
 * normalizeCounterTolerance(5)        // [0, 5] - look-ahead only (secure default)
 * normalizeCounterTolerance([10, 5])  // [10, 5] - explicit past/future
 * normalizeCounterTolerance([5, 5])   // [5, 5] - explicit symmetric (use with caution)
 * ```
 */
export function normalizeCounterTolerance(
  counterTolerance: number | [number, number] = 0,
): [number, number] {
  return Array.isArray(counterTolerance) ? counterTolerance : [0, counterTolerance];
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
