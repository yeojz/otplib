/**
 * @otplib/hotp
 *
 * RFC 4226 HOTP (HMAC-Based One-Time Password) implementation.
 *
 * @see {@link https://tools.ietf.org/html/rfc4226 | RFC 4226}
 */

import {
  counterToBytes,
  createCryptoContext,
  createGuardrails,
  dynamicTruncate,
  truncateDigits,
  validateCounter,
  validateSecret,
  validateToken,
  validateCounterTolerance,
  normalizeSecret,
  normalizeCounterTolerance,
  requireSecret,
  requireCryptoPlugin,
} from "@otplib/core";

import type { HOTPGenerateOptions, HOTPVerifyOptions, VerifyResult } from "./types.js";
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
  const { secret, counter, algorithm = "sha1", digits = 6, crypto, base32, guardrails } = options;

  requireSecret(secret);
  requireCryptoPlugin(crypto);

  const secretBytes = normalizeSecret(secret, base32);
  validateSecret(secretBytes, guardrails);
  validateCounter(counter, guardrails);

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
  counterNum: number;
  past: number;
  future: number;
  totalChecks: number;
  crypto: CryptoPlugin;

  getGenerateOptions: (counter: number) => HOTPGenerateOptions;
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
    guardrails = createGuardrails(),
  } = options;

  requireSecret(secret);
  requireCryptoPlugin(crypto);

  const secretBytes = normalizeSecret(secret, base32);
  validateSecret(secretBytes, guardrails);
  validateCounter(counter, guardrails);
  validateToken(token, digits);
  validateCounterTolerance(counterTolerance, guardrails);

  const counterNum = typeof counter === "bigint" ? Number(counter) : counter;
  const [past, future] = normalizeCounterTolerance(counterTolerance);
  const totalChecks = past + future + 1;

  return {
    token,
    counterNum,
    past,
    future,
    totalChecks,
    crypto,
    getGenerateOptions: (cnt: number) => ({
      secret: secretBytes,
      counter: cnt,
      algorithm,
      digits,
      crypto,
      guardrails,
    }),
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
  const { token, counterNum, past, totalChecks, crypto, getGenerateOptions } =
    getHOTPVerifyOptions(options);

  // Optimization: Skip iterations that would produce negative counters
  // If counterNum=2 and past=5: startI = 3 (skip first 3 iterations)
  // If counterNum=10 and past=5: startI = 0 (no skip needed)
  const startI = Math.max(0, past - counterNum);

  // Use positive loop index to avoid -0 edge cases and negative loop variables
  // Map index [startI...totalChecks-1] to offset [startI-past...future]
  for (let i = startI; i < totalChecks; i++) {
    const offset = i - past;
    const currentCounter = counterNum + offset;
    // currentCounter is guaranteed >= 0 due to startI optimization

    const expected = await generate(getGenerateOptions(currentCounter));
    if (crypto.constantTimeEqual(expected, token)) {
      return { valid: true, delta: offset | 0 }; // Bitwise OR converts -0 to +0
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
  const { token, counterNum, past, totalChecks, crypto, getGenerateOptions } =
    getHOTPVerifyOptions(options);

  // Optimization: Skip iterations that would produce negative counters
  // If counterNum=2 and past=5: startI = 3 (skip first 3 iterations)
  // If counterNum=10 and past=5: startI = 0 (no skip needed)
  const startI = Math.max(0, past - counterNum);

  // Use positive loop index to avoid -0 edge cases and negative loop variables
  // Map index [startI...totalChecks-1] to offset [startI-past...future]
  for (let i = startI; i < totalChecks; i++) {
    const offset = i - past;
    const currentCounter = counterNum + offset;
    // currentCounter is guaranteed >= 0 due to startI optimization

    const expected = generateSync(getGenerateOptions(currentCounter));
    if (crypto.constantTimeEqual(expected, token)) {
      return { valid: true, delta: offset | 0 }; // Bitwise OR converts -0 to +0
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
} from "./types.js";

export { HOTP } from "./class.js";

// Result wrapping utilities for users who want safe variants
export { wrapResult, wrapResultAsync } from "@otplib/core";
