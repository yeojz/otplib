/**
 * @otplib/totp
 *
 * RFC 6238 TOTP (Time-Based One-Time Password) implementation.
 *
 * TOTP extends HOTP (RFC 4226) by using time as the moving factor
 * instead of an event counter.
 *
 * @see {@link https://tools.ietf.org/html/rfc6238 | RFC 6238}
 * @see {@link https://tools.ietf.org/html/rfc4226 | RFC 4226 (HOTP base algorithm)}
 */

import {
  createGuardrails,
  normalizeSecret,
  normalizeEpochTolerance,
  validateEpochTolerance,
  validatePeriod,
  validateSecret,
  validateTime,
  validateToken,
} from "@otplib/core";
import { generate as generateHOTP, generateSync as generateHOTPSync } from "@otplib/hotp";

import type { TOTPGenerateOptions, TOTPVerifyOptions, VerifyResult } from "./types";
import type { CryptoPlugin, Digits, HashAlgorithm } from "@otplib/core";

/**
 * Normalized options for TOTP generation
 * @internal
 */
type TOTPGenerateOptionsInternal = {
  secret: Uint8Array;
  counter: number;
  algorithm: HashAlgorithm;
  digits: Digits;
  crypto: CryptoPlugin;
};

/**
 * Prepare and validate TOTP generation options
 *
 * Extracts defaults, normalizes the secret, validates parameters,
 * and calculates the HOTP counter from the epoch.
 *
 * @param options - TOTP generation options
 * @returns Normalized options ready for HOTP generation
 * @internal
 */
function getTOTPGenerateOptions(options: TOTPGenerateOptions): TOTPGenerateOptionsInternal {
  const {
    secret,
    epoch = Math.floor(Date.now() / 1000),
    t0 = 0,
    period = 30,
    algorithm = "sha1",
    digits = 6,
    crypto,
    base32,
  } = options;

  const secretBytes = normalizeSecret(secret, base32);
  validateSecret(secretBytes, createGuardrails());
  validateTime(epoch);
  validatePeriod(period);

  const counter = Math.floor((epoch - t0) / period);

  return {
    secret: secretBytes,
    counter,
    algorithm,
    digits,
    crypto,
  };
}

/**
 * Generate a Time-based One-Time Password (TOTP)
 *
 * Implements the TOTP algorithm as specified in RFC 6238 Section 4:
 *
 * ```
 * T = (Current Unix time - T0) / X
 * TOTP = HOTP(K, T)
 * ```
 *
 * Where:
 * - T0 is the Unix time to start counting time steps (default 0, per RFC 6238 Section 4.1)
 * - X is the time step in seconds (default 30, per RFC 6238 Section 4.1)
 * - K is the shared secret key
 *
 * @see {@link https://tools.ietf.org/html/rfc6238#section-4 | RFC 6238 Section 4 - TOTP Algorithm}
 * @see {@link https://tools.ietf.org/html/rfc6238#section-4.1 | RFC 6238 Section 4.1 - Parameters}
 *
 * @param options - TOTP generation options
 * @returns The TOTP code as a string
 *
 * @example
 * ```ts
 * import { generate } from '@otplib/totp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 *
 * const totp = generate({
 *   secret: new Uint8Array([1, 2, 3, 4, 5]),
 *   time: Date.now() / 1000,
 *   period: 30,
 *   digits: 6,
 *   crypto: new NodeCryptoPlugin(),
 * });
 * // Returns: '123456'
 * ```
 */
export async function generate(options: TOTPGenerateOptions): Promise<string> {
  const opt = getTOTPGenerateOptions(options);
  return generateHOTP(opt);
}

/**
 * Generate a Time-based One-Time Password (TOTP) synchronously
 *
 * This is the synchronous version of {@link generate}. It requires a crypto
 * plugin that supports synchronous HMAC operations (e.g., NodeCryptoPlugin
 * or NobleCryptoPlugin). Using this with WebCryptoPlugin will throw an error.
 *
 * @see {@link generate} for the async version
 * @see {@link https://tools.ietf.org/html/rfc6238#section-4 | RFC 6238 Section 4}
 *
 * @param options - TOTP generation options
 * @returns The TOTP code as a string
 * @throws {HMACError} If the crypto plugin doesn't support sync operations
 *
 * @example
 * ```ts
 * import { generateSync } from '@otplib/totp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 *
 * const totp = generateSync({
 *   secret: new Uint8Array([1, 2, 3, 4, 5]),
 *   epoch: Math.floor(Date.now() / 1000),
 *   period: 30,
 *   digits: 6,
 *   crypto: new NodeCryptoPlugin(),
 * });
 * // Returns: '123456'
 * ```
 */
export function generateSync(options: TOTPGenerateOptions): string {
  const opt = getTOTPGenerateOptions(options);
  return generateHOTPSync(opt);
}

/**
 * Normalized options for TOTP verification
 * @internal
 */
type TOTPVerifyOptionsInternal = {
  token: string;
  crypto: CryptoPlugin;
  minCounter: number;
  maxCounter: number;
  currentCounter: number;
  t0: number;
  period: number;

  getGenerateOptions: (counter: number) => TOTPGenerateOptions;
};

/**
 * Prepare and validate TOTP verification options
 *
 * Extracts defaults, normalizes the secret, validates parameters,
 * and calculates the counter range based on epoch tolerance.
 *
 * @param options - TOTP verification options
 * @returns Normalized options with calculated counter range
 * @internal
 */
function getTOTPVerifyOptions(options: TOTPVerifyOptions): TOTPVerifyOptionsInternal {
  const {
    secret,
    token,
    epoch = Math.floor(Date.now() / 1000),
    t0 = 0,
    period = 30,
    algorithm = "sha1",
    digits = 6,
    crypto,
    base32,
    epochTolerance = 0,
  } = options;

  const secretBytes = normalizeSecret(secret, base32);
  validateSecret(secretBytes, createGuardrails());
  validateTime(epoch);
  validatePeriod(period);
  validateToken(token, digits);
  validateEpochTolerance(epochTolerance, period);

  const currentCounter = Math.floor((epoch - t0) / period);

  // Normalize epochTolerance to [pastTolerance, futureTolerance]
  const [pastTolerance, futureTolerance] = normalizeEpochTolerance(epochTolerance);

  // Calculate the range of counters that could have valid tokens
  // Valid time range is [epoch - pastTolerance, epoch + futureTolerance]
  const minCounter = Math.max(0, Math.floor((epoch - pastTolerance - t0) / period));
  const maxCounter = Math.floor((epoch + futureTolerance - t0) / period);

  return {
    token,
    crypto,
    minCounter,
    maxCounter,
    currentCounter,
    t0,
    period,
    getGenerateOptions: (counter: number) => ({
      secret: secretBytes,
      epoch: counter * period + t0,
      t0,
      period,
      algorithm,
      digits,
      crypto,
    }),
  };
}

/**
 * Verify a TOTP code
 *
 * Compares the provided token against the expected TOTP value
 * using constant-time comparison to prevent timing attacks.
 *
 * The verification window allows for clock drift between client and server,
 * as recommended in RFC 6238 Section 5.2.
 *
 * @see {@link https://tools.ietf.org/html/rfc6238#section-5.2 | RFC 6238 Section 5.2 - Validation and Time-Step Size}
 *
 * @param options - TOTP verification options
 * @returns Verification result with validity and optional delta
 *
 * @example Using epochTolerance
 * ```ts
 * import { verify } from '@otplib/totp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 *
 * // Accept tokens valid within ±30 seconds
 * const result = await verify({
 *   secret: mySecret,
 *   token: '123456',
 *   epochTolerance: 30,
 *   crypto: new NodeCryptoPlugin(),
 * });
 * if (result.valid) {
 *   console.log(`Token matched at epoch: ${result.epoch}`);
 * }
 * ```
 */
export async function verify(options: TOTPVerifyOptions): Promise<VerifyResult> {
  const { token, crypto, minCounter, maxCounter, currentCounter, t0, period, getGenerateOptions } =
    getTOTPVerifyOptions(options);

  for (let counter = minCounter; counter <= maxCounter; counter++) {
    const expected = await generate(getGenerateOptions(counter));
    if (crypto.constantTimeEqual(expected, token)) {
      return { valid: true, delta: counter - currentCounter, epoch: counter * period + t0 };
    }
  }

  return { valid: false };
}

/**
 * Verify a TOTP code synchronously
 *
 * This is the synchronous version of {@link verify}. It requires a crypto
 * plugin that supports synchronous HMAC operations (e.g., NodeCryptoPlugin
 * or NobleCryptoPlugin). Using this with WebCryptoPlugin will throw an error.
 *
 * @see {@link verify} for the async version
 * @see {@link https://tools.ietf.org/html/rfc6238#section-5.2 | RFC 6238 Section 5.2}
 *
 * @param options - TOTP verification options
 * @returns Verification result with validity and optional delta
 * @throws {HMACError} If the crypto plugin doesn't support sync operations
 *
 * @example
 * ```ts
 * import { verifySync } from '@otplib/totp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 *
 * const result = verifySync({
 *   secret: mySecret,
 *   token: '123456',
 *   epochTolerance: 30,
 *   crypto: new NodeCryptoPlugin(),
 * });
 * if (result.valid) {
 *   console.log(`Token matched at epoch: ${result.epoch}`);
 * }
 * ```
 */
export function verifySync(options: TOTPVerifyOptions): VerifyResult {
  const { token, crypto, minCounter, maxCounter, currentCounter, t0, period, getGenerateOptions } =
    getTOTPVerifyOptions(options);

  for (let counter = minCounter; counter <= maxCounter; counter++) {
    const expected = generateSync(getGenerateOptions(counter));
    if (crypto.constantTimeEqual(expected, token)) {
      return { valid: true, delta: counter - currentCounter, epoch: counter * period + t0 };
    }
  }

  return { valid: false };
}

/**
 * Get the remaining time until the next TOTP period
 *
 * @param time - Current Unix timestamp in seconds (default: now)
 * @param period - Time step in seconds (default: 30)
 * @param t0 - Initial Unix time to start counting time steps (default: 0)
 * @returns Remaining seconds until next period
 *
 * @example
 * ```ts
 * import { getRemainingTime } from '@otplib/totp';
 *
 * const remaining = getRemainingTime();
 * // Returns: 15 (seconds remaining in current 30-second window)
 * ```
 */
export function getRemainingTime(
  time: number = Math.floor(Date.now() / 1000),
  period: number = 30,
  t0: number = 0,
): number {
  validateTime(time);
  validatePeriod(period);

  const counter = Math.floor((time - t0) / period);
  const nextCounter = counter + 1;
  const nextTime = nextCounter * period + t0;

  return nextTime - time;
}

/**
 * Get the current TOTP counter value
 *
 * @param time - Current Unix timestamp in seconds (default: now)
 * @param period - Time step in seconds (default: 30)
 * @param t0 - Initial Unix time to start counting time steps (default: 0)
 * @returns Current counter value
 *
 * @example
 * ```ts
 * import { getTimeStepUsed } from '@otplib/totp';
 *
 * const counter = getTimeStepUsed();
 * // Returns: 12345 (current counter value)
 * ```
 */
export function getTimeStepUsed(
  time: number = Math.floor(Date.now() / 1000),
  period: number = 30,
  t0: number = 0,
): number {
  validateTime(time);
  validatePeriod(period);

  return Math.floor((time - t0) / period);
}

export type { CryptoPlugin, Digits, HashAlgorithm, OTPResult } from "@otplib/core";
export type {
  TOTPOptions,
  TOTPGenerateOptions,
  TOTPVerifyOptions,
  VerifyResult,
  VerifyResultValid,
  VerifyResultInvalid,
} from "./types";

export { TOTP } from "./class";

// Result wrapping utilities for users who want safe variants
export { wrapResult, wrapResultAsync } from "@otplib/core";
