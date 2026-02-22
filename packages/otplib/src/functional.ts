import { generateSecret as generateSecretCore, ConfigurationError } from "@otplib/core";
import {
  generate as generateHOTP,
  generateSync as generateHOTPSync,
  verify as verifyHOTP,
  verifySync as verifyHOTPSync,
} from "@otplib/hotp";
import {
  generate as generateTOTP,
  generateSync as generateTOTPSync,
  verify as verifyTOTP,
  verifySync as verifyTOTPSync,
} from "@otplib/totp";
import { generateTOTP as generateTOTPURI, generateHOTP as generateHOTURI } from "@otplib/uri";

import {
  defaultCrypto,
  defaultBase32,
  normalizeTOTPGenerateOptions,
  normalizeHOTPGenerateOptions,
  normalizeTOTPVerifyOptions,
  normalizeHOTPVerifyOptions,
} from "./defaults.js";

import type {
  OTPGenerateOptions,
  OTPVerifyOptions,
  OTPStrategy,
  TOTPGenerateOptions,
  HOTPGenerateOptions,
} from "./types.js";
import type {
  CryptoPlugin,
  Base32Plugin,
  Digits,
  HashAlgorithm,
  TOTPGenerateResult,
} from "@otplib/core";
import type { VerifyResult as HOTPVerifyResult } from "@otplib/hotp";
import type { VerifyResult as TOTPVerifyResult } from "@otplib/totp";

export type { OTPStrategy };

export type VerifyResult = TOTPVerifyResult | HOTPVerifyResult;

function resolveStrategy(strategy: unknown): OTPStrategy {
  if (strategy === undefined || strategy === "totp" || strategy === "hotp") {
    return strategy ?? "totp";
  }
  throw new ConfigurationError(
    `Unknown OTP strategy: ${strategy}. Valid strategies are 'totp' or 'hotp'.`,
  );
}

function requireCounter(counter: number | undefined): number {
  if (counter === undefined) {
    throw new ConfigurationError(
      "Counter is required for HOTP strategy. Example: { strategy: 'hotp', counter: 0 }",
    );
  }
  return counter;
}

/**
 * Generate a random secret key for use with OTP
 *
 * The secret is encoded in Base32 format for compatibility with
 * Google Authenticator and other authenticator apps.
 *
 * @param options - Secret generation options
 * @returns Base32-encoded secret key
 *
 * @example
 * ```ts
 * import { generateSecret } from 'otplib';
 *
 * const secret = generateSecret();
 * // Returns: 'JBSWY3DPEHPK3PXP'
 * ```
 *
 * @example With custom plugins
 * ```ts
 * import { generateSecret, NodeCryptoPlugin } from 'otplib';
 *
 * const secret = generateSecret({
 *   crypto: new NodeCryptoPlugin(),
 * });
 * ```
 */
export function generateSecret(options?: {
  /**
   * Number of random bytes to generate (default: 20)
   * 20 bytes = 160 bits, which provides a good security margin
   */
  length?: number;

  /**
   * Crypto plugin to use (default: NobleCryptoPlugin)
   */
  crypto?: CryptoPlugin;

  /**
   * Base32 plugin to use (default: ScureBase32Plugin)
   */
  base32?: Base32Plugin;
}): string {
  const { crypto = defaultCrypto, base32 = defaultBase32, length = 20 } = options || {};

  return generateSecretCore({ crypto, base32, length });
}

/**
 * Generate an otpauth:// URI for QR code generation
 *
 * This URI can be used to generate a QR code that can be scanned
 * by Google Authenticator and other authenticator apps.
 *
 * @param options - URI generation options
 * @returns otpauth:// URI string
 *
 * @example TOTP
 * ```ts
 * import { generateURI } from 'otplib';
 *
 * const uri = generateURI({
 *   issuer: 'ACME Co',
 *   label: 'john@example.com',
 *   secret: 'JBSWY3DPEHPK3PXP',
 * });
 * // Returns: 'otpauth://totp/ACME%20Co:john%40example.com?secret=...'
 * ```
 *
 * @example HOTP
 * ```ts
 * import { generateURI } from 'otplib';
 *
 * const uri = generateURI({
 *   strategy: 'hotp',
 *   issuer: 'ACME Co',
 *   label: 'john@example.com',
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   counter: 5,
 * });
 * // Returns: 'otpauth://hotp/ACME%20Co:john%40example.com?secret=...&counter=5'
 * ```
 */
export function generateURI(options: {
  /**
   * OTP strategy to use (default: 'totp')
   */
  strategy?: OTPStrategy;
  issuer: string;
  label: string;
  /**
   * Base32-encoded secret key
   *
   * **Note**: By default, strings are assumed to be Base32 encoded.
   * If you have a raw string/passphrase, you must convert it to Uint8Array first.
   */
  secret: string;
  algorithm?: HashAlgorithm;
  digits?: Digits;
  period?: number;
  counter?: number;
}): string {
  const {
    strategy,
    issuer,
    label,
    secret,
    algorithm = "sha1",
    digits = 6,
    period = 30,
    counter,
  } = options;
  const resolvedStrategy = resolveStrategy(strategy);

  if (resolvedStrategy === "totp") {
    return generateTOTPURI({ issuer, label, secret, algorithm, digits, period });
  }

  return generateHOTURI({
    issuer,
    label,
    secret,
    algorithm,
    digits,
    counter: requireCounter(counter),
  });
}

/**
 * Generate an OTP code
 *
 * Generates a one-time password based on the specified strategy.
 * - 'totp': Time-based OTP (default)
 * - 'hotp': HMAC-based OTP
 *
 * @param options - OTP generation options
 * @returns OTP code
 *
 * @example TOTP
 * ```ts
 * import { generate } from 'otplib';
 *
 * const token = await generate({
 *   secret: 'JBSWY3DPEHPK3PXP',
 * });
 * // Returns: '123456'
 * ```
 *
 * @example HOTP
 * ```ts
 * import { generate } from 'otplib';
 *
 * const token = await generate({
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   strategy: 'hotp',
 *   counter: 0,
 * });
 * ```
 *
 * @example With custom plugins
 * ```ts
 * import { generate, NodeCryptoPlugin } from 'otplib';
 *
 * const token = await generate({
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   crypto: new NodeCryptoPlugin(),
 * });
 * ```
 */
export async function generate(
  options: TOTPGenerateOptions & { format: "detailed" },
): Promise<TOTPGenerateResult>;
export async function generate(options: TOTPGenerateOptions): Promise<string>;
export async function generate(options: HOTPGenerateOptions): Promise<string>;
export async function generate(options: OTPGenerateOptions): Promise<string | TOTPGenerateResult> {
  const strategy = resolveStrategy(options.strategy);

  if (strategy === "hotp") {
    const opts = normalizeHOTPGenerateOptions({
      ...options,
      strategy: "hotp",
      counter: requireCounter(options.counter),
    });
    const { secret, crypto, base32, algorithm, digits, hooks } = opts;

    return generateHOTP({
      secret,
      crypto,
      base32,
      algorithm,
      digits,
      hooks,
      counter: opts.counter,
      guardrails: opts.guardrails,
    });
  }

  const opts = normalizeTOTPGenerateOptions({
    ...options,
    strategy: "totp",
  });
  const { secret, crypto, base32, algorithm, digits, hooks } = opts;

  return generateTOTP({
    secret,
    crypto,
    base32,
    algorithm,
    digits,
    hooks,
    period: opts.period,
    epoch: opts.epoch,
    t0: opts.t0,
    guardrails: opts.guardrails,
    format: opts.format,
  });
}

/**
 * Generate an OTP code synchronously
 *
 * This is the synchronous version of {@link generate}. It requires a crypto
 * plugin that supports synchronous HMAC operations.
 *
 * @param options - OTP generation options
 * @returns OTP code
 * @throws {HMACError} If the crypto plugin doesn't support sync operations
 *
 * @example
 * ```ts
 * import { generateSync } from 'otplib';
 *
 * const token = generateSync({
 *   secret: 'JBSWY3DPEHPK3PXP',
 * });
 * ```
 */
export function generateSync(
  options: TOTPGenerateOptions & { format: "detailed" },
): TOTPGenerateResult;
export function generateSync(options: TOTPGenerateOptions): string;
export function generateSync(options: HOTPGenerateOptions): string;
export function generateSync(options: OTPGenerateOptions): string | TOTPGenerateResult {
  const strategy = resolveStrategy(options.strategy);

  if (strategy === "hotp") {
    const opts = normalizeHOTPGenerateOptions({
      ...options,
      strategy: "hotp",
      counter: requireCounter(options.counter),
    });
    const { secret, crypto, base32, algorithm, digits, hooks } = opts;

    return generateHOTPSync({
      secret,
      crypto,
      base32,
      algorithm,
      digits,
      hooks,
      counter: opts.counter,
      guardrails: opts.guardrails,
    });
  }

  const opts = normalizeTOTPGenerateOptions({
    ...options,
    strategy: "totp",
  });
  const { secret, crypto, base32, algorithm, digits, hooks } = opts;

  return generateTOTPSync({
    secret,
    crypto,
    base32,
    algorithm,
    digits,
    hooks,
    period: opts.period,
    epoch: opts.epoch,
    t0: opts.t0,
    guardrails: opts.guardrails,
    format: opts.format,
  });
}

/**
 * Verify an OTP code
 *
 * Verifies a provided OTP code against the expected value based on the strategy.
 * - 'totp': Time-based OTP (default, Google Authenticator compatible)
 * - 'hotp': HMAC-based OTP
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param options - OTP verification options
 * @returns Verification result with validity and optional delta
 *
 * @example TOTP
 * ```ts
 * import { verify } from 'otplib';
 *
 * const result = await verify({
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   token: '123456',
 * });
 * // Returns: { valid: true, delta: 0 }
 * ```
 *
 * @example HOTP
 * ```ts
 * import { verify } from 'otplib';
 *
 * const result = await verify({
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   token: '123456',
 *   strategy: 'hotp',
 *   counter: 0,
 * });
 * ```
 *
 * @example With epochTolerance for TOTP
 * ```ts
 * import { verify, NodeCryptoPlugin } from 'otplib';
 *
 * const result = await verify({
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   token: '123456',
 *   epochTolerance: 30,
 *   crypto: new NodeCryptoPlugin(),
 * });
 * ```
 */
export async function verify(options: OTPVerifyOptions): Promise<VerifyResult> {
  const strategy = resolveStrategy(options.strategy);

  if (strategy === "hotp") {
    const opts = normalizeHOTPVerifyOptions({
      ...options,
      strategy: "hotp",
      counter: requireCounter(options.counter),
    });
    const { secret, token, crypto, base32, algorithm, digits, hooks } = opts;

    return verifyHOTP({
      secret,
      token,
      crypto,
      base32,
      algorithm,
      digits,
      hooks,
      counter: opts.counter,
      counterTolerance: opts.counterTolerance,
      guardrails: opts.guardrails,
    });
  }

  const opts = normalizeTOTPVerifyOptions({
    ...options,
    strategy: "totp",
  });
  const { secret, token, crypto, base32, algorithm, digits, hooks } = opts;

  return verifyTOTP({
    secret,
    token,
    crypto,
    base32,
    algorithm,
    digits,
    hooks,
    period: opts.period,
    epoch: opts.epoch,
    t0: opts.t0,
    epochTolerance: opts.epochTolerance,
    afterTimeStep: opts.afterTimeStep,
    guardrails: opts.guardrails,
  });
}

/**
 * Verify an OTP code synchronously
 *
 * This is the synchronous version of {@link verify}. It requires a crypto
 * plugin that supports synchronous HMAC operations.
 *
 * @param options - OTP verification options
 * @returns Verification result with validity and optional delta
 * @throws {HMACError} If the crypto plugin doesn't support sync operations
 *
 * @example
 * ```ts
 * import { verifySync } from 'otplib';
 *
 * const result = verifySync({
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   token: '123456',
 * });
 * ```
 */
export function verifySync(options: OTPVerifyOptions): VerifyResult {
  const strategy = resolveStrategy(options.strategy);

  if (strategy === "hotp") {
    const opts = normalizeHOTPVerifyOptions({
      ...options,
      strategy: "hotp",
      counter: requireCounter(options.counter),
    });
    const { secret, token, crypto, base32, algorithm, digits, hooks } = opts;

    return verifyHOTPSync({
      secret,
      token,
      crypto,
      base32,
      algorithm,
      digits,
      hooks,
      counter: opts.counter,
      counterTolerance: opts.counterTolerance,
      guardrails: opts.guardrails,
    });
  }

  const opts = normalizeTOTPVerifyOptions({
    ...options,
    strategy: "totp",
  });
  const { secret, token, crypto, base32, algorithm, digits, hooks } = opts;

  return verifyTOTPSync({
    secret,
    token,
    crypto,
    base32,
    algorithm,
    digits,
    hooks,
    period: opts.period,
    epoch: opts.epoch,
    t0: opts.t0,
    epochTolerance: opts.epochTolerance,
    afterTimeStep: opts.afterTimeStep,
    guardrails: opts.guardrails,
  });
}
