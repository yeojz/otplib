/**
 * @otplib/hotp
 *
 * Type definitions for HOTP implementation
 */

import type {
  CryptoPlugin,
  Digits,
  HashAlgorithm,
  Base32Plugin,
  OTPGuardrails,
} from "@otplib/core";

/**
 * HOTP configuration options
 *
 * All properties are optional for flexible class-based configuration.
 * Use `HOTPGenerateOptions` or `HOTPVerifyOptions` for function parameters
 * where certain fields are required.
 */
export type HOTPOptions = {
  /** The shared secret key (Base32-encoded string or raw bytes) */
  readonly secret?: string | Uint8Array;
  /** The counter value (8-byte unsigned integer) */
  readonly counter?: number | bigint;
  /** Hash algorithm to use (default: 'sha1') */
  readonly algorithm?: HashAlgorithm;
  /** Number of digits in the OTP code (default: 6) */
  readonly digits?: Digits;
  /** Crypto plugin to use for HMAC operations */
  readonly crypto?: CryptoPlugin;
  /** Base32 plugin to decode string secrets (required if secret is a string) */
  readonly base32?: Base32Plugin;
  /** Service provider name (for URI generation) */
  readonly issuer?: string;
  /** User identifier/email/username (for URI generation) */
  readonly label?: string;
  /**
   * Custom guardrails to override validation limits
   * Use this carefully - see danger-zone documentation
   */
  readonly guardrails?: Partial<OTPGuardrails>;
};

/**
 * Required options for HOTP generation
 *
 * Requires `secret`, `counter`, and `crypto` for OTP generation.
 * Optional `guardrails` for custom validation limits.
 */
export type HOTPGenerateOptions = HOTPOptions & {
  readonly secret: string | Uint8Array;
  readonly counter: number | bigint;
  readonly crypto: CryptoPlugin;
  readonly guardrails?: Partial<OTPGuardrails> | Readonly<OTPGuardrails>;
};

/**
 * Required options for HOTP verification
 *
 * Requires `secret`, `counter`, `token`, and `crypto` for verification.
 */
export type HOTPVerifyOptions = HOTPGenerateOptions & {
  /** The OTP token to verify */
  readonly token: string;
  /**
   * Counter tolerance for verification (default: 0)
   * - Number: symmetric look-ahead window [counter, counter + counterTolerance]
   * - Array: asymmetric window, where positive values are look-ahead and negative values are look-back
   *   Examples: [0, 1] allows counter and counter+1; [-1, 0, 1] allows counter-1, counter, counter+1
   */
  readonly counterTolerance?: number | number[];
};

/**
 * Successful verification result with delta offset
 */
export type VerifyResultValid = {
  /** Token is valid */
  readonly valid: true;
  /**
   * The offset from the base counter/time step where the token matched.
   * - For HOTP: Number of counter steps ahead (0 = exact match, 1 = one ahead, etc.)
   * - For TOTP: Number of time periods offset (can be negative for past, positive for future)
   *
   * Use this value to resynchronize the counter (HOTP) or detect clock drift (TOTP).
   */
  readonly delta: number;
};

/**
 * Failed verification result
 */
export type VerifyResultInvalid = {
  /** Token is invalid */
  readonly valid: false;
};

/**
 * Result of OTP verification (discriminated union)
 *
 * Use type narrowing to access `delta`:
 * ```ts
 * const result = await verify({ secret, token, counter });
 * if (result.valid) {
 *   // TypeScript knows delta exists here
 *   const nextCounter = counter + result.delta + 1;
 *   await saveCounter(userId, nextCounter);
 * }
 * ```
 */
export type VerifyResult = VerifyResultValid | VerifyResultInvalid;
