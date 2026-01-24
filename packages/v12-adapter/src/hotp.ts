/**
 * @otplib/v12-adapter
 *
 * v12-compatible HOTP class implementation.
 * Provides synchronous API wrapper around v13's HOTP implementation.
 */

import { stringToBytes, dynamicTruncate, truncateDigits, createGuardrails } from "@otplib/core";
import { generateSync as hotpGenerateSync, verifySync as hotpVerifySync } from "@otplib/hotp";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { generateHOTP as generateHOTPURI } from "@otplib/uri";
import { hex } from "@scure/base";

import { HashAlgorithms, KeyEncodings as KeyEncodingsConst } from "./types.js";

import type { HOTPOptions, SecretKey, ResolvedHOTPOptions } from "./types.js";
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
 * Convert a string secret to bytes based on encoding
 * @internal
 */
export function secretToBytes(secret: SecretKey, encoding?: string): Uint8Array {
  if (encoding === KeyEncodingsConst.BASE32 || encoding === "base32") {
    return defaultBase32.decode(secret);
  }
  if (encoding === KeyEncodingsConst.HEX || encoding === "hex") {
    return hex.decode(secret.replace(/\s/g, ""));
  }
  // Default: treat as ASCII/UTF-8
  return stringToBytes(secret);
}

/**
 * Converts a digest to a token of a specified length.
 * Uses dynamicTruncate and truncateDigits from core.
 */
export function hotpDigestToToken(hexDigest: string, digits: number): string {
  const digestBytes = hex.decode(hexDigest);
  const truncated = dynamicTruncate(digestBytes);
  return truncateDigits(truncated, digits);
}

/**
 * v12-compatible HOTP class
 *
 * Provides the same API as otplib v12 HOTP class while using v13's
 * implementation internally.
 *
 * @example
 * ```typescript
 * import { HOTP } from '@otplib/v12-adapter';
 *
 * const hotp = new HOTP();
 * const secret = 'JBSWY3DPEHPK3PXP';
 * const token = hotp.generate(secret, 0);
 * const isValid = hotp.check(token, secret, 0);
 * ```
 */
export class HOTP<T extends HOTPOptions = HOTPOptions> {
  /**
   * Stored options that can be modified
   */
  protected _options: Partial<T> = {};

  /**
   * Default options applied to all operations
   */
  protected _defaultOptions: Partial<T> = {};

  constructor(defaultOptions: Partial<T> = {}) {
    this._defaultOptions = {
      ...defaultOptions,
      guardrails: createGuardrails(defaultOptions.guardrails),
    } as Partial<T>;
    this._options = {};
  }

  /**
   * Get current options (merged with defaults)
   */
  get options(): Partial<T> {
    return { ...this._defaultOptions, ...this._options };
  }

  /**
   * Set options (replaces current options)
   */
  set options(value: Partial<T>) {
    this._options = { ...value };
  }

  /**
   * Creates a new instance with the specified default options
   */
  create(defaultOptions: Partial<T> = {}): HOTP<T> {
    return new HOTP<T>(defaultOptions);
  }

  /**
   * Returns class options polyfilled with default values
   */
  allOptions(): Readonly<ResolvedHOTPOptions> {
    const merged = {
      algorithm: HashAlgorithms.SHA1,
      digits: 6,
      encoding: KeyEncodingsConst.ASCII,
      crypto: defaultCrypto,
      base32: defaultBase32,
      ...this._defaultOptions,
      ...this._options,
    };
    return Object.freeze(merged) as Readonly<ResolvedHOTPOptions>;
  }

  /**
   * Reset options to defaults
   */
  resetOptions(): this {
    this._options = {};
    return this;
  }

  /**
   * Generate an HOTP token
   */
  generate(secret: SecretKey, counter: number): string {
    const opts = this.allOptions();
    const secretBytes = secretToBytes(secret, opts.encoding);

    return hotpGenerateSync({
      secret: secretBytes,
      counter,
      algorithm: opts.algorithm,
      digits: opts.digits as Digits,
      crypto: opts.crypto,
      guardrails: opts.guardrails,
    });
  }

  /**
   * Check if a token is valid for the given secret and counter
   */
  check(token: string, secret: SecretKey, counter: number): boolean {
    const opts = this.allOptions();
    const secretBytes = secretToBytes(secret, opts.encoding);

    try {
      const result = hotpVerifySync({
        secret: secretBytes,
        token,
        counter,
        algorithm: opts.algorithm,
        digits: opts.digits as Digits,
        counterTolerance: 0,
        crypto: opts.crypto,
        guardrails: opts.guardrails,
      });

      return result.valid;
    } catch {
      return false;
    }
  }

  /**
   * Verify a token (object-based API)
   */
  verify(opts: { token: string; secret: SecretKey; counter: number }): boolean {
    if (typeof opts !== "object") {
      throw new Error("Expecting argument 0 of verify to be an object");
    }
    return this.check(opts.token, opts.secret, opts.counter);
  }

  /**
   * Generate an otpauth:// URI for HOTP
   */
  keyuri(accountName: string, issuer: string, secret: SecretKey, counter: number): string {
    const opts = this.allOptions();

    return generateHOTPURI({
      label: accountName,
      issuer,
      secret,
      algorithm: opts.algorithm,
      digits: opts.digits as Digits,
      counter,
    });
  }
}
