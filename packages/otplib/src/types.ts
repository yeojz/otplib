/**
 * Type definitions for otplib package
 */

import type { CryptoPlugin, Base32Plugin, Digits, HashAlgorithm } from "@otplib/core";
import type { TOTPOptions } from "@otplib/totp";

// Re-export TOTPOptions for type-only usage
export type { TOTPOptions };

/**
 * OTP Strategy Type
 */
export type OTPStrategy = "totp" | "hotp";

/**
 * Options with plugin overrides
 */
export type OTPAuthOptions = {
  /**
   * Crypto plugin to use (default: NobleCryptoPlugin)
   */
  readonly crypto?: CryptoPlugin;

  /**
   * Base32 plugin to use (default: ScureBase32Plugin)
   */
  readonly base32?: Base32Plugin;
};

/**
 * Common options for OTP generation
 *
 * These options apply to both TOTP and HOTP strategies.
 */
export type OTPGenerateOptions = {
  /**
   * Base32-encoded secret key
   */
  secret: string;

  /**
   * OTP strategy to use (default: 'totp')
   * - 'totp': Time-based OTP
   * - 'hotp': HMAC-based OTP
   */
  strategy?: OTPStrategy;

  /**
   * Crypto plugin to use (default: NobleCryptoPlugin)
   */
  crypto?: CryptoPlugin;

  /**
   * Base32 plugin to use (default: ScureBase32Plugin)
   */
  base32?: Base32Plugin;

  /**
   * Hash algorithm (default: 'sha1')
   */
  algorithm?: HashAlgorithm;

  /**
   * Number of digits (default: 6)
   */
  digits?: Digits;

  /**
   * Time step in seconds (default: 30)
   * Used by TOTP strategy
   */
  period?: number;

  /**
   * Current Unix epoch timestamp in seconds (default: now)
   * Used by TOTP strategy
   */
  epoch?: number;

  /**
   * Initial Unix time to start counting time steps (default: 0)
   * Used by TOTP strategy
   */
  t0?: number;

  /**
   * Counter value
   * Used by HOTP strategy (required)
   */
  counter?: number;
};

/**
 * Options for OTP verification
 *
 * Extends OTPFunctionalOptions with token and tolerance parameters.
 */
export type OTPVerifyOptions = OTPGenerateOptions & {
  /**
   * OTP code to verify
   */
  token: string;

  /**
   * Time tolerance in seconds for TOTP verification (default: 0)
   * - Number: symmetric tolerance (same for past and future)
   * - Tuple [past, future]: asymmetric tolerance
   *   Use [5, 0] for RFC-compliant past-only verification.
   */
  epochTolerance?: number | [number, number];

  /**
   * Counter tolerance for HOTP verification (default: 0)
   * - Number: symmetric look-ahead window
   * - Array: asymmetric window
   */
  counterTolerance?: number | number[];
};

/**
 * OTP options with all defaults applied
 */
export type OTPGenerateOptionsWithDefaults = Required<Omit<OTPGenerateOptions, "counter">> & {
  counter?: number;
};

/**
 * OTP verify options with all defaults applied
 */
export type OTPVerifyOptionsWithDefaults = OTPGenerateOptionsWithDefaults &
  Required<Omit<OTPVerifyOptions, keyof OTPGenerateOptions>>;

/**
 * Strategy handlers for TOTP/HOTP dispatch
 */
export type StrategyHandlers<T> = {
  totp: () => T;
  hotp: (counter: number) => T;
};
