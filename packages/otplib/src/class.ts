/**
 * OTP Wrapper Class
 *
 * A unified class that dynamically handles TOTP and HOTP strategies.
 */

import { generateSecret as generateSecretCore } from "@otplib/core";

import { defaultCrypto, defaultBase32 } from "./defaults";
import {
  generate as functionalGenerate,
  generateSync as functionalGenerateSync,
  verify as functionalVerify,
  verifySync as functionalVerifySync,
  generateURI as functionalGenerateURI,
} from "./functional";

import type { OTPStrategy } from "./functional";
import type { CryptoPlugin, Digits, HashAlgorithm, Base32Plugin } from "@otplib/core";
import type { VerifyResult as HOTPVerifyResult } from "@otplib/hotp";
import type { VerifyResult as TOTPVerifyResult } from "@otplib/totp";

/**
 * Combined verify result that works for both TOTP and HOTP
 */
export type VerifyResult = TOTPVerifyResult | HOTPVerifyResult;

/**
 * Options for the OTP class
 */
export type OTPClassOptions = {
  /**
   * OTP strategy to use
   * - 'totp': Time-based OTP (default)
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
};

/**
 * Options for generating a token with the OTP class
 */
export type OTPGenerateOptions = {
  /**
   * Base32-encoded secret key
   */
  secret: string;

  /**
   * Hash algorithm (default: 'sha1')
   */
  algorithm?: HashAlgorithm;

  /**
   * Number of digits (default: 6)
   */
  digits?: Digits;

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
   * Time step in seconds (default: 30)
   * Used by TOTP strategy
   */
  period?: number;

  /**
   * Counter value
   * Used by HOTP strategy (required)
   */
  counter?: number;
};

/**
 * Options for verifying a token with the OTP class
 */
export type OTPVerifyOptions = {
  /**
   * Base32-encoded secret key
   */
  secret: string;

  /**
   * OTP code to verify
   */
  token: string;

  /**
   * Hash algorithm (default: 'sha1')
   */
  algorithm?: HashAlgorithm;

  /**
   * Number of digits (default: 6)
   */
  digits?: Digits;

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
   * Time step in seconds (default: 30)
   * Used by TOTP strategy
   */
  period?: number;

  /**
   * Counter value
   * Used by HOTP strategy (required)
   */
  counter?: number;

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
 * Options for generating URI with the OTP class
 */
export type OTPURIGenerateOptions = {
  /**
   * Issuer name (e.g., 'ACME Co')
   */
  issuer: string;

  /**
   * Label/Account name (e.g., 'john@example.com')
   */
  label: string;

  /**
   * Base32-encoded secret key
   */
  secret: string;

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
   * Counter value (default: 0)
   * Used by HOTP strategy
   */
  counter?: number;
};

/**
 * OTP Class
 *
 * A wrapper class that dynamically handles TOTP and HOTP strategies.
 *
 * @example
 * ```ts
 * import { OTP } from 'otplib';
 *
 * // Create OTP instance with TOTP strategy (default)
 * const otp = new OTP({ strategy: 'totp' });
 *
 * // Generate and verify
 * const secret = otp.generateSecret();
 * const token = await otp.generate({ secret });
 * const result = await otp.verify({ secret, token });
 * ```
 *
 * @example With HOTP strategy
 * ```ts
 * import { OTP } from 'otplib';
 *
 * const otp = new OTP({ strategy: 'hotp' });
 * const token = await otp.generate({ secret: 'ABC123', counter: 0 });
 * ```
 *
 * @example Generating otpauth:// URI for authenticator apps
 * ```ts
 * import { OTP } from 'otplib';
 *
 * const otp = new OTP({ strategy: 'totp' });
 * const uri = otp.generateURI({
 *   issuer: 'MyApp',
 *   label: 'user@example.com',
 *   secret: 'ABC123',
 * });
 * ```
 */
export class OTP {
  private readonly strategy: OTPStrategy;
  private readonly crypto: CryptoPlugin;
  private readonly base32: Base32Plugin;

  constructor(options: OTPClassOptions = {}) {
    const { strategy = "totp", crypto = defaultCrypto, base32 = defaultBase32 } = options;

    this.strategy = strategy;
    this.crypto = crypto;
    this.base32 = base32;
  }

  /**
   * Get the current strategy
   */
  getStrategy(): OTPStrategy {
    return this.strategy;
  }

  /**
   * Generate a random secret key
   *
   * @param length - Number of random bytes (default: 20)
   * @returns Base32-encoded secret key
   */
  generateSecret(length: number = 20): string {
    return generateSecretCore({ crypto: this.crypto, base32: this.base32, length });
  }

  /**
   * Generate an OTP token based on the configured strategy
   *
   * @param options - Generation options
   * @returns OTP code
   */
  async generate(options: OTPGenerateOptions): Promise<string> {
    return functionalGenerate({
      ...options,
      strategy: this.strategy,
      crypto: this.crypto,
      base32: this.base32,
    });
  }

  /**
   * Generate an OTP token based on the configured strategy synchronously
   *
   * @param options - Generation options
   * @returns OTP code
   * @throws {HMACError} If the crypto plugin doesn't support sync operations
   */
  generateSync(options: OTPGenerateOptions): string {
    return functionalGenerateSync({
      ...options,
      strategy: this.strategy,
      crypto: this.crypto,
      base32: this.base32,
    });
  }

  /**
   * Verify an OTP token based on the configured strategy
   *
   * @param options - Verification options
   * @returns Verification result with validity and optional delta
   */
  async verify(options: OTPVerifyOptions): Promise<VerifyResult> {
    return functionalVerify({
      ...options,
      strategy: this.strategy,
      crypto: this.crypto,
      base32: this.base32,
    });
  }

  /**
   * Verify an OTP token based on the configured strategy synchronously
   *
   * @param options - Verification options
   * @returns Verification result with validity and optional delta
   * @throws {HMACError} If the crypto plugin doesn't support sync operations
   */
  verifySync(options: OTPVerifyOptions): VerifyResult {
    return functionalVerifySync({
      ...options,
      strategy: this.strategy,
      crypto: this.crypto,
      base32: this.base32,
    });
  }

  /**
   * Generate an otpauth:// URI for QR code generation
   *
   * Supports both TOTP and HOTP strategies.
   *
   * @param options - URI generation options
   * @returns otpauth:// URI string
   */
  generateURI(options: OTPURIGenerateOptions): string {
    return functionalGenerateURI({
      ...options,
      strategy: this.strategy,
    });
  }
}
