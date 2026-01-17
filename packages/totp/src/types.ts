/**
 * @otplib/totp
 *
 * Type definitions for TOTP implementation
 */

import type {
  CryptoPlugin,
  Digits,
  HashAlgorithm,
  Base32Plugin,
  OTPGuardrails,
} from "@otplib/core";

/**
 * TOTP configuration options
 *
 * All properties are optional for flexible class-based configuration.
 * Use `TOTPGenerateOptions` or `TOTPVerifyOptions` for function parameters
 * where certain fields are required.
 */
export type TOTPOptions = {
  /** The shared secret key (Base32-encoded string or raw bytes) */
  readonly secret?: string | Uint8Array;
  /** Current Unix epoch timestamp in seconds (default: Date.now() / 1000) */
  readonly epoch?: number;
  /**
   * Initial Unix time to start counting time steps (default: 0)
   *
   * Per RFC 6238, T0 is the Unix time from which to start counting.
   * Most implementations use 0, but some systems may use a different start time.
   *
   * Formula: counter = floor((epoch - t0) / period)
   */
  readonly t0?: number;
  /** Time step in seconds (default: 30) */
  readonly period?: number;
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
   * Must be created via createGuardrails() factory
   * Use this carefully - see danger-zone documentation
   */
  readonly guardrails?: OTPGuardrails;
};

/**
 * Required options for TOTP generation
 *
 * Requires `secret` and `crypto` for OTP generation.
 * Optional `guardrails` must be created via createGuardrails() factory.
 */
export type TOTPGenerateOptions = TOTPOptions & {
  readonly secret: string | Uint8Array;
  readonly crypto: CryptoPlugin;
};

/**
 * Required options for TOTP verification
 *
 * Requires `secret`, `token`, and `crypto` for verification.
 */
export type TOTPVerifyOptions = TOTPGenerateOptions & {
  /** The OTP token to verify */
  readonly token: string;
  /**
   * Time tolerance in seconds (default: 0 = current period only)
   *
   * Accepts tokens that were or will be valid within the specified tolerance
   * of the current time. This aligns with RFC 6238's transmission delay concept.
   *
   * @see {@link https://tools.ietf.org/html/rfc6238#section-5.2 | RFC 6238 Section 5.2}
   *
   * - Number: symmetric tolerance (same for past and future)
   *   `epochTolerance: 5` checks [epoch - 5, epoch + 5]
   *
   * - Tuple [past, future]: asymmetric tolerance
   *   `epochTolerance: [5, 0]` checks [epoch - 5, epoch] (RFC-compliant, past only)
   *   `epochTolerance: [5, 10]` checks [epoch - 5, epoch + 10]
   *
   * @example Recommended values by security level
   * ```typescript
   * // RFC-compliant (transmission delay only, past tokens)
   * epochTolerance: [5, 0]
   *
   * // High security (banking, critical systems)
   * epochTolerance: 5  // or [5, 5] symmetric
   *
   * // Standard (most 2FA implementations)
   * epochTolerance: 30
   *
   * // Lenient (poor network, user-friendly)
   * epochTolerance: 60
   * ```
   *
   * @example How tolerance works
   * ```
   * With period=30 and epochTolerance=[5, 0] (RFC-compliant):
   *
   * Period N-1         | Period N (current)  | Period N+1
   * [token A valid]    | [token B valid]     | [token C valid]
   *                    |                     |
   * At epoch in period N:
   * - If 0-5 sec into period:  A valid, B valid
   * - If 6-29 sec into period: B valid only
   * (Future tokens never accepted)
   * ```
   */
  readonly epochTolerance?: number | [number, number];
};

/**
 * Successful verification result with delta offset
 */
export type VerifyResultValid = {
  /** Token is valid */
  readonly valid: true;
  /**
   * The offset from the current time step where the token matched.
   * - 0: Token matched at current time step (no drift)
   * - Negative: Token matched in a past time step (client clock behind)
   * - Positive: Token matched in a future time step (client clock ahead)
   */
  readonly delta: number;
  /**
   * The exact epoch timestamp (in seconds) of the period start where the token matched.
   *
   * This provides the precise Unix timestamp for the beginning of the time period
   * in which the token was valid. Useful for logging, debugging, and advanced
   * time drift analysis.
   *
   * @example
   * ```typescript
   * const result = await verify({ secret, token, epochTolerance: 30 });
   * if (result.valid) {
   *   console.log(`Token matched at epoch: ${result.epoch}`);
   *   console.log(`Token was ${result.delta} periods away`);
   * }
   * ```
   */
  readonly epoch: number;
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
 * const result = await verify({ secret, token, epochTolerance: 30 });
 * if (result.valid) {
 *   // TypeScript knows delta exists here
 *   if (result.delta !== 0) {
 *     console.log(`Clock drift detected: ${result.delta} periods`);
 *   }
 *   console.log(`Token matched at epoch: ${result.epoch}`);
 * }
 * ```
 */
export type VerifyResult = VerifyResultValid | VerifyResultInvalid;

/**
 * Result of TOTP generation
 *
 * Contains both the generated token and the time step used for generation.
 * This provides consistency with the verification return type and allows
 * applications to track which time step was used.
 *
 * @example
 * ```typescript
 * const result = await generate({ secret, crypto });
 * console.log(`Token: ${result.token}`);
 * console.log(`Time step: ${result.timeStep}`);
 * ```
 */
export type GenerateResult = {
  /** The generated TOTP code */
  readonly token: string;
  /**
   * The time step number (per RFC 6238) used for generation.
   *
   * Per RFC 6238, time step T = floor((CurrentUnixTime - T0) / X), where X is the period.
   * This is the actual time step counter value, not a Unix timestamp.
   *
   * @example
   * ```typescript
   * const result = await generate({
   *   secret,
   *   epoch: 1234567890,
   *   period: 30,
   *   crypto,
   * });
   * console.log(result.timeStep); // 41152263
   * ```
   */
  readonly timeStep: number;
};
