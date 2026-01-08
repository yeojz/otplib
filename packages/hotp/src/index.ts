/**
 * @otplib/hotp
 *
 * RFC 4226 HOTP (HMAC-Based One-Time Password) implementation.
 *
 * @see {@link https://tools.ietf.org/html/rfc4226 | RFC 4226}
 */

import {
  CounterError,
  counterToBytes,
  createCryptoContext,
  dynamicTruncate,
  truncateDigits,
  validateCounter,
  validateSecret,
  validateToken,
  validateCounterTolerance,
  normalizeSecret,
  normalizeCounterTolerance,
} from "@otplib/core";

import type { HOTPGenerateOptions, HOTPVerifyOptions, VerifyResult } from "./types";
import type { CryptoContext } from "@otplib/core";
import type { Digits, HashAlgorithm, CryptoPlugin } from "@otplib/core";

/**
 * Normalized options for HOTP generation
 * @internal
 */
type HOTPGenerateOptionsInternal = {
  ctx: CryptoContext;
  algorithm: HashAlgorithm;
  digits: Digits;
  secretBytes: Uint8Array;
  counterBytes: Uint8Array;
};

/**
 * Prepare and validate HOTP generation options
 *
 * Extracts defaults, normalizes the secret, validates parameters,
 * and creates the crypto context.
 *
 * @param options - HOTP generation options
 * @returns Normalized options with crypto context and counter bytes
 * @internal
 */
function getHOTPGenerateOptions(options: HOTPGenerateOptions): HOTPGenerateOptionsInternal {
  const { secret, counter, algorithm = "sha1", digits = 6, crypto, base32 } = options;

  const secretBytes = normalizeSecret(secret, base32);
  validateSecret(secretBytes);
  validateCounter(counter);

  const ctx = createCryptoContext(crypto);
  const counterBytes = counterToBytes(counter);

  return { ctx, algorithm, digits, secretBytes, counterBytes };
}

/**
 * Generate an HMAC-based One-Time Password (HOTP)
 *
 * Implements the HOTP algorithm as specified in RFC 4226 Section 5.3:
 *
 * 1. Convert counter to 8-byte big-endian array (RFC 4226 Section 5.1)
 * 2. Compute HMAC-SHA-1 using the secret key and counter (RFC 4226 Section 5.2)
 * 3. Apply dynamic truncation to extract 4-byte code (RFC 4226 Section 5.3)
 * 4. Reduce modulo 10^digits to get final OTP (RFC 4226 Section 5.3)
 *
 * @see {@link https://tools.ietf.org/html/rfc4226#section-5.3 | RFC 4226 Section 5.3 - Generating an HOTP Value}
 *
 * @param options - HOTP generation options
 * @returns The HOTP code as a string
 *
 * @example
 * ```ts
 * import { generate } from '@otplib/hotp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 *
 * const hotp = generate({
 *   secret: new Uint8Array([1, 2, 3, 4, 5]),
 *   counter: 0,
 *   digits: 6,
 *   crypto: new NodeCryptoPlugin(),
 * });
 * // Returns: '123456'
 * ```
 */
export async function generate(options: HOTPGenerateOptions): Promise<string> {
  const { ctx, algorithm, digits, secretBytes, counterBytes } = getHOTPGenerateOptions(options);
  const hmac = await ctx.hmac(algorithm, secretBytes, counterBytes);
  const dt = dynamicTruncate(hmac);

  return truncateDigits(dt, digits);
}

/**
 * Generate an HMAC-based One-Time Password (HOTP) synchronously
 *
 * This is the synchronous version of {@link generate}. It requires a crypto
 * plugin that supports synchronous HMAC operations (e.g., NodeCryptoPlugin
 * or NobleCryptoPlugin). Using this with WebCryptoPlugin will throw an error.
 *
 * @see {@link generate} for the async version
 * @see {@link https://tools.ietf.org/html/rfc4226#section-5.3 | RFC 4226 Section 5.3}
 *
 * @param options - HOTP generation options
 * @returns The HOTP code as a string
 * @throws {HMACError} If the crypto plugin doesn't support sync operations
 *
 * @example
 * ```ts
 * import { generateSync } from '@otplib/hotp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 *
 * const hotp = generateSync({
 *   secret: new Uint8Array([1, 2, 3, 4, 5]),
 *   counter: 0,
 *   digits: 6,
 *   crypto: new NodeCryptoPlugin(),
 * });
 * // Returns: '123456'
 * ```
 */
export function generateSync(options: HOTPGenerateOptions): string {
  const { ctx, algorithm, digits, secretBytes, counterBytes } = getHOTPGenerateOptions(options);
  const hmac = ctx.hmacSync(algorithm, secretBytes, counterBytes);
  const dt = dynamicTruncate(hmac);

  return truncateDigits(dt, digits);
}

/**
 * Normalized options for HOTP verification
 * @internal
 */
type HOTPVerifyOptionsInternal = {
  token: string;
  secretBytes: Uint8Array;
  counterNum: number;
  offsets: number[];
  algorithm: HashAlgorithm;
  digits: Digits;
  crypto: CryptoPlugin;
};

/**
 * Prepare and validate HOTP verification options
 *
 * Extracts defaults, normalizes the secret, validates parameters,
 * and calculates the counter offsets based on tolerance.
 *
 * @param options - HOTP verification options
 * @returns Normalized options with calculated counter offsets
 * @internal
 */
function getHOTPVerifyOptions(options: HOTPVerifyOptions): HOTPVerifyOptionsInternal {
  const {
    secret,
    counter,
    token,
    algorithm = "sha1",
    digits = 6,
    crypto,
    base32,
    counterTolerance = 0,
  } = options;

  const secretBytes = normalizeSecret(secret, base32);
  validateSecret(secretBytes);
  validateCounter(counter);
  validateToken(token, digits);
  validateCounterTolerance(counterTolerance);

  const counterNum = typeof counter === "bigint" ? Number(counter) : counter;
  const offsets = normalizeCounterTolerance(counterTolerance);

  return {
    token,
    secretBytes,
    counterNum,
    offsets,
    algorithm,
    digits,
    crypto,
  };
}

/**
 * Verify an HOTP code
 *
 * Compares the provided token against the expected HOTP value
 * using constant-time comparison to prevent timing attacks.
 *
 * @see {@link https://tools.ietf.org/html/rfc4226#section-7.2 | RFC 4226 Section 7.2 - Validation and Verification}
 * @see {@link https://tools.ietf.org/html/rfc4226#section-7.4 | RFC 4226 Section 7.4 - Resynchronization}
 *
 * ## Counter Resynchronization (RFC 4226 Section 7.4)
 *
 * When using a verification window, the `delta` value in the result indicates
 * how many counter steps ahead the token was found. After successful verification,
 * you should update the stored counter to prevent replay attacks:
 *
 * ```ts
 * const nextCounter = counter + result.delta + 1;
 * ```
 *
 * This ensures that the same token cannot be reused.
 *
 * @param options - HOTP verification options
 * @returns Verification result with validity and optional delta
 *
 * @example Basic verification
 * ```ts
 * import { verify } from '@otplib/hotp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 *
 * const result = await verify({
 *   secret: new Uint8Array([1, 2, 3, 4, 5]),
 *   counter: 0,
 *   token: '123456',
 *   crypto: new NodeCryptoPlugin(),
 * });
 * // Returns: { valid: true, delta: 0 }
 * ```
 *
 * @example Counter resynchronization with counterTolerance
 * ```ts
 * // User's token was generated at counter 5, but server expects counter 3
 * const result = await verify({
 *   secret,
 *   counter: 3,      // Server's stored counter
 *   token: userToken,
 *   counterTolerance: 5,       // Allow up to 5 counters ahead
 *   crypto: new NodeCryptoPlugin(),
 * });
 *
 * if (result.valid) {
 *   // Token matched at counter 3 + delta
 *   // Update stored counter to prevent replay attacks
 *   const nextCounter = 3 + result.delta + 1; // = 6
 *   await saveCounter(userId, nextCounter);
 * }
 * ```
 */
export async function verify(options: HOTPVerifyOptions): Promise<VerifyResult> {
  const { token, secretBytes, counterNum, offsets, algorithm, digits, crypto } =
    getHOTPVerifyOptions(options);

  for (const offset of offsets) {
    const currentCounter = counterNum + offset;

    // Check if counter is valid - skip invalid counters
    // (e.g., negative values from tolerance calculations)
    try {
      validateCounter(currentCounter);
    } catch (error) {
      /* v8 ignore next -- @preserve */
      if (error instanceof CounterError) continue;
      /* v8 ignore next -- @preserve */
      throw error;
    }

    const expected = await generate({
      secret: secretBytes,
      counter: currentCounter,
      algorithm,
      digits,
      crypto,
    });

    if (crypto.constantTimeEqual(expected, token)) {
      return { valid: true, delta: offset };
    }
  }

  return { valid: false };
}

/**
 * Verify an HOTP code synchronously
 *
 * This is the synchronous version of {@link verify}. It requires a crypto
 * plugin that supports synchronous HMAC operations (e.g., NodeCryptoPlugin
 * or NobleCryptoPlugin). Using this with WebCryptoPlugin will throw an error.
 *
 * @see {@link verify} for the async version
 * @see {@link https://tools.ietf.org/html/rfc4226#section-7.2 | RFC 4226 Section 7.2}
 *
 * @param options - HOTP verification options
 * @returns Verification result with validity and optional delta
 * @throws {HMACError} If the crypto plugin doesn't support sync operations
 *
 * @example
 * ```ts
 * import { verifySync } from '@otplib/hotp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 *
 * const result = verifySync({
 *   secret: new Uint8Array([1, 2, 3, 4, 5]),
 *   counter: 0,
 *   token: '123456',
 *   crypto: new NodeCryptoPlugin(),
 * });
 * // Returns: { valid: true, delta: 0 }
 * ```
 */
export function verifySync(options: HOTPVerifyOptions): VerifyResult {
  const { token, secretBytes, counterNum, offsets, algorithm, digits, crypto } =
    getHOTPVerifyOptions(options);

  for (const offset of offsets) {
    const currentCounter = counterNum + offset;

    // Check if counter is valid - skip invalid counters
    // (e.g., negative values from tolerance calculations)
    try {
      validateCounter(currentCounter);
    } catch (error) {
      /* v8 ignore next -- @preserve */
      if (error instanceof CounterError) continue;
      /* v8 ignore next -- @preserve */
      throw error;
    }

    const expected = generateSync({
      secret: secretBytes,
      counter: currentCounter,
      algorithm,
      digits,
      crypto,
    });

    if (crypto.constantTimeEqual(expected, token)) {
      return { valid: true, delta: offset };
    }
  }

  return { valid: false };
}

export type { CryptoPlugin, Digits, HashAlgorithm, OTPResult } from "@otplib/core";
export type {
  HOTPOptions,
  HOTPGenerateOptions,
  HOTPVerifyOptions,
  VerifyResult,
  VerifyResultValid,
  VerifyResultInvalid,
} from "./types";

export { HOTP } from "./class";

// Result wrapping utilities for users who want safe variants
export { wrapResult, wrapResultAsync } from "@otplib/core";
