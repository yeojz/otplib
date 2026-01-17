/**
 * @otplib/v12-adapter
 *
 * v12-compatible TOTP class implementation.
 * Provides synchronous API wrapper around v13's TOTP implementation.
 */

import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import {
  generateSync as totpGenerateSync,
  verifySync as totpVerifySync,
  getRemainingTime,
} from "@otplib/totp";
import { generateTOTP as generateTOTPURI } from "@otplib/uri";

import { HOTP, secretToBytes } from "./hotp.js";
import { HashAlgorithms, KeyEncodings as KeyEncodingsConst } from "./types.js";

import type { TOTPOptions, SecretKey, ResolvedTOTPOptions } from "./types.js";
import type { Digits } from "@otplib/core";

/**
 * Default crypto plugin instance
 */
const defaultCrypto = new NobleCryptoPlugin();

/**
 * Default base32 plugin instance
 */
const defaultBase32 = new ScureBase32Plugin();

/**
 * Parse window option into epochTolerance
 * v12 uses "window" as number of steps, v13 uses epochTolerance in seconds
 */
function parseWindow(
  window: number | [number, number] | undefined,
  step: number,
): number | [number, number] {
  if (window === undefined || window === 0) {
    return 0;
  }
  if (typeof window === "number") {
    return window * step;
  }
  // [past, future] steps → [past, future] seconds
  return [window[0] * step, window[1] * step];
}

/**
 * v12-compatible TOTP class
 *
 * Provides the same API as otplib v12 TOTP class while using v13's
 * implementation internally.
 *
 * @example
 * ```typescript
 * import { TOTP } from '@otplib/v12-adapter';
 *
 * const totp = new TOTP();
 * const secret = 'JBSWY3DPEHPK3PXP';
 * const token = totp.generate(secret);
 * const isValid = totp.check(token, secret);
 * ```
 */
export class TOTP<T extends TOTPOptions = TOTPOptions> extends HOTP<T> {
  constructor(defaultOptions: Partial<T> = {}) {
    super(defaultOptions);
  }

  /**
   * Creates a new TOTP instance with the specified default options
   */
  override create(defaultOptions: Partial<T> = {}): TOTP<T> {
    return new TOTP<T>(defaultOptions);
  }

  /**
   * Returns class options polyfilled with TOTP default values
   */
  override allOptions(): Readonly<ResolvedTOTPOptions> {
    const merged = {
      algorithm: HashAlgorithms.SHA1,
      digits: 6,
      encoding: KeyEncodingsConst.ASCII,
      epoch: Date.now(),
      step: 30,
      window: 0 as number | [number, number],
      crypto: defaultCrypto,
      base32: defaultBase32,
      ...this._defaultOptions,
      ...this._options,
    };
    return Object.freeze(merged) as Readonly<ResolvedTOTPOptions>;
  }

  /**
   * Generate a TOTP token
   *
   * @param secret - The secret key
   * @returns The OTP token
   */
  generate(secret: SecretKey): string {
    const opts = this.allOptions();
    const secretBytes = secretToBytes(secret, opts.encoding);
    // v12 uses epoch in milliseconds, always convert to seconds
    const epochSeconds = Math.floor(opts.epoch / 1000);

    const result = totpGenerateSync({
      secret: secretBytes,
      algorithm: opts.algorithm,
      digits: opts.digits as Digits,
      period: opts.step,
      epoch: epochSeconds,
      t0: 0,
      crypto: opts.crypto,
    });
    return result.token;
  }

  /**
   * Check if a token is valid for the given secret
   *
   * @param token - The token to verify
   * @param secret - The secret key
   * @returns true if valid
   */
  check(token: string, secret: SecretKey): boolean {
    const delta = this.checkDelta(token, secret);
    return typeof delta === "number";
  }

  /**
   * Check token and return the time window delta
   *
   * @param token - The token to verify
   * @param secret - The secret key
   * @returns Window delta (0 = current, positive = future, negative = past), null if invalid
   */
  checkDelta(token: string, secret: SecretKey): number | null {
    const opts = this.allOptions();
    const secretBytes = secretToBytes(secret, opts.encoding);
    // v12 uses epoch in milliseconds, always convert to seconds
    const epochSeconds = Math.floor(opts.epoch / 1000);
    const step = opts.step;
    const window = opts.window;

    const epochTolerance = parseWindow(window, step);

    try {
      const result = totpVerifySync({
        secret: secretBytes,
        token,
        algorithm: opts.algorithm,
        digits: opts.digits as Digits,
        period: step,
        epoch: epochSeconds,
        t0: 0,
        epochTolerance,
        crypto: opts.crypto,
      });

      if (!result.valid) {
        return null;
      }

      // v13 returns delta directly as time step offset
      return result.delta;
    } catch {
      return null;
    }
  }

  /**
   * Verify a token (object-based API)
   *
   * @param opts - Verification options
   * @returns true if valid
   */
  verify(opts: { token: string; secret: SecretKey }): boolean {
    if (typeof opts !== "object") {
      throw new Error("Expecting argument 0 of verify to be an object");
    }
    return this.check(opts.token, opts.secret);
  }

  /**
   * Generate an otpauth:// URI for TOTP
   *
   * @param accountName - Account name for the URI
   * @param issuer - Issuer name
   * @param secret - The secret key (should be Base32 for QR codes)
   * @returns The otpauth:// URI
   */
  keyuri(accountName: string, issuer: string, secret: SecretKey): string {
    const opts = this.allOptions();

    return generateTOTPURI({
      label: accountName,
      issuer,
      secret,
      algorithm: opts.algorithm,
      digits: opts.digits as Digits,
      period: opts.step,
    });
  }

  /**
   * Get time used in current step (seconds elapsed in current window)
   *
   * @returns Seconds used in current step
   */
  timeUsed(): number {
    const opts = this.allOptions();
    // v12 uses epoch in milliseconds, convert to seconds
    const epochSeconds = Math.floor(opts.epoch / 1000);
    return epochSeconds % opts.step;
  }

  /**
   * Get time remaining until next token
   *
   * @returns Seconds remaining in current step
   */
  timeRemaining(): number {
    const opts = this.allOptions();
    // v12 uses epoch in milliseconds, convert to seconds
    const epochSeconds = Math.floor(opts.epoch / 1000);
    return getRemainingTime(epochSeconds, opts.step, 0);
  }
}
