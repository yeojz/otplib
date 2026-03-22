/**
 * Type definitions for otplib package
 */

import type {
  CryptoPlugin,
  Base32Plugin,
  Digits,
  HashAlgorithm,
  OTPGuardrails,
  OTPHooks,
  OTPFormat,
} from "@otplib/core";
import type { HOTPOptions } from "@otplib/hotp";
import type { TOTPOptions } from "@otplib/totp";

// Re-export OTP options for type-only usage
export type { HOTPOptions };
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
 * Common options for OTP generation and verification
 *
 * These options apply to both TOTP and HOTP strategies.
 */
export type OTPGenerateCommonOptions = {
  /**
   * Base32-encoded secret key
   *
   * **Note**: By default, strings are assumed to be Base32 encoded.
   * If you have a raw string/passphrase, you must convert it to Uint8Array first.
   */
  secret: string | Uint8Array;

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
   * Validation guardrails
   */
  guardrails?: OTPGuardrails;

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
   * Hooks for customizing token encoding and validation.
   * Allows non-standard OTP variants (e.g., Steam Guard) to replace
   * the default numeric encoding with custom schemes.
   */
  hooks?: OTPHooks;
};

/**
 * TOTP-specific generation options
 */
export type TOTPExtraArgs = {
  /**
   * Output format for TOTP generation
   *
   * - `"default"` (or omitted): returns a plain `string` token (same as `"plain"`)
   * - `"plain"`: returns a plain `string` token
   * - `"full"`: returns `{ token, timeStep, epoch }` with computed metadata
   */
  format?: OTPFormat;
};

/**
 * TOTP generation options
 */
export type TOTPGenerateOptions = OTPGenerateCommonOptions &
  TOTPExtraArgs & {
    /**
     * OTP strategy to use (default: 'totp')
     */
    strategy?: "totp";

    /**
     * Counter value
     *
     * Accepted for backward compatibility and ignored by TOTP strategy.
     */
    counter?: number;
  };

/**
 * HOTP generation options
 */
export type HOTPGenerateOptions = OTPGenerateCommonOptions & {
  /**
   * OTP strategy to use
   */
  strategy: "hotp";

  /**
   * Counter value
   * Used by HOTP strategy (required)
   */
  counter: number;

  /**
   * Output format for generation
   *
   * Accepted for backward compatibility and ignored by HOTP strategy.
   * This will be tightened in a future major version.
   */
  format?: OTPFormat;
};

/**
 * Common options for OTP generation
 */
export type OTPGenerateOptions = TOTPGenerateOptions | HOTPGenerateOptions;

/**
 * Common options for OTP verification
 */
export type OTPVerifyCommonOptions = OTPGenerateCommonOptions & {
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
   * - Number: creates look-ahead only tolerance [0, n]
   * - Tuple [past, future]: explicit window control
   */
  counterTolerance?: number | [number, number];

  /**
   * Minimum allowed TOTP time step for replay protection (optional)
   *
   * Rejects tokens with timeStep <= afterTimeStep.
   * Only used by TOTP strategy.
   */
  afterTimeStep?: number;

  /**
   * Output format for verification
   *
   * - `"default"` (or omitted): returns `VerifyResult` object (same as `"full"`)
   * - `"plain"`: returns `boolean` (true if valid, false if invalid)
   * - `"full"`: returns `VerifyResult` object with delta, epoch, and timeStep
   *
   * Only used by TOTP strategy. HOTP ignores this option.
   */
  format?: OTPFormat;
};

/**
 * TOTP verification options
 */
export type TOTPVerifyOptions = OTPVerifyCommonOptions & {
  /**
   * OTP strategy to use (default: 'totp')
   */
  strategy?: "totp";

  /**
   * Counter value
   *
   * Accepted for backward compatibility and ignored by TOTP strategy.
   */
  counter?: number;
};

/**
 * HOTP verification options
 */
export type HOTPVerifyOptions = OTPVerifyCommonOptions & {
  /**
   * OTP strategy to use
   */
  strategy: "hotp";

  /**
   * Counter value
   * Used by HOTP strategy (required)
   */
  counter: number;
};

/**
 * Options for OTP verification
 */
export type OTPVerifyOptions = TOTPVerifyOptions | HOTPVerifyOptions;

type OTPNormalizedCommonOptions = Required<Omit<OTPGenerateCommonOptions, "hooks">> & {
  hooks?: OTPHooks;
};

/**
 * TOTP options with all defaults applied
 */
export type TOTPGenerateOptionsWithDefaults = OTPNormalizedCommonOptions &
  TOTPExtraArgs & {
    strategy: "totp";
    counter?: number;
  };

/**
 * HOTP options with all defaults applied
 */
export type HOTPGenerateOptionsWithDefaults = OTPNormalizedCommonOptions & {
  strategy: "hotp";
  counter: number;
  format?: OTPFormat;
};

/**
 * OTP options with all defaults applied
 */
export type OTPGenerateOptionsWithDefaults =
  | TOTPGenerateOptionsWithDefaults
  | HOTPGenerateOptionsWithDefaults;

type OTPVerifyNormalizedCommonOptions = OTPNormalizedCommonOptions & {
  token: string;
  epochTolerance: number | [number, number];
  counterTolerance: number | [number, number];
  afterTimeStep?: number;
  format?: OTPFormat;
};

/**
 * TOTP verify options with all defaults applied
 */
export type TOTPVerifyOptionsWithDefaults = OTPVerifyNormalizedCommonOptions & {
  strategy: "totp";
  counter?: number;
};

/**
 * HOTP verify options with all defaults applied
 */
export type HOTPVerifyOptionsWithDefaults = OTPVerifyNormalizedCommonOptions & {
  strategy: "hotp";
  counter: number;
};

/**
 * OTP verify options with all defaults applied
 */
export type OTPVerifyOptionsWithDefaults =
  | TOTPVerifyOptionsWithDefaults
  | HOTPVerifyOptionsWithDefaults;
