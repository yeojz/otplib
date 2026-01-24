/**
 * @otplib/v12-adapter
 *
 * v12-compatible Authenticator class implementation.
 * Provides same API as v12 with Base32 encoding support.
 */

import { generateSecret as generateSecretCore } from "@otplib/core";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { generateSync as totpGenerateSync, verifySync as totpVerifySync } from "@otplib/totp";

import { TOTP } from "./totp.js";
import { HashAlgorithms, KeyEncodings as KeyEncodingsConst } from "./types.js";

import type {
  AuthenticatorOptions,
  Base32SecretKey,
  SecretKey,
  KeyEncodings,
  ResolvedAuthenticatorOptions,
} from "./types.js";
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
 * Default key encoder - encodes raw bytes to Base32
 */
function defaultKeyEncoder(secret: SecretKey, _encoding: KeyEncodings): Base32SecretKey {
  const bytes = new TextEncoder().encode(secret);
  return defaultBase32.encode(bytes);
}

/**
 * Default key decoder - decodes Base32 to string
 */
function defaultKeyDecoder(encodedSecret: Base32SecretKey, _encoding: KeyEncodings): SecretKey {
  const bytes = defaultBase32.decode(encodedSecret);
  return new TextDecoder().decode(bytes);
}

/**
 * v12-compatible Authenticator class
 *
 * The Authenticator class is a TOTP variant that uses Base32-encoded secrets
 * by default, making it compatible with Google Authenticator and similar apps.
 *
 * @example
 * ```typescript
 * import { Authenticator } from '@otplib/v12-adapter';
 *
 * const authenticator = new Authenticator();
 * const secret = authenticator.generateSecret();
 * const token = authenticator.generate(secret);
 * const isValid = authenticator.check(token, secret);
 * const uri = authenticator.keyuri('user@example.com', 'MyApp', secret);
 * ```
 */
export class Authenticator<T extends AuthenticatorOptions = AuthenticatorOptions> extends TOTP<T> {
  constructor(defaultOptions: Partial<T> = {}) {
    super(defaultOptions);
  }

  /**
   * Creates a new Authenticator instance with the specified default options
   */
  override create(defaultOptions: Partial<T> = {}): Authenticator<T> {
    return new Authenticator<T>(defaultOptions);
  }

  /**
   * Returns class options polyfilled with Authenticator default values
   */
  override allOptions(): Readonly<ResolvedAuthenticatorOptions> {
    const merged = {
      algorithm: HashAlgorithms.SHA1,
      digits: 6,
      encoding: KeyEncodingsConst.HEX,
      epoch: Date.now(),
      step: 30,
      window: 0 as number | [number, number],
      keyEncoder: defaultKeyEncoder,
      keyDecoder: defaultKeyDecoder,
      crypto: defaultCrypto,
      base32: defaultBase32,
      ...this._defaultOptions,
      ...this._options,
    };
    return Object.freeze(merged) as Readonly<ResolvedAuthenticatorOptions>;
  }

  /**
   * Generate an OTP token from a Base32 secret
   *
   * @param secret - Base32-encoded secret
   * @returns The OTP token
   */
  override generate(secret: Base32SecretKey): string {
    const opts = this.allOptions();

    // Generate using decoded secret (as raw bytes)
    const secretBytes = defaultBase32.decode(secret);
    const epoch = opts.epoch;
    const epochSeconds = epoch >= 1e12 ? Math.floor(epoch / 1000) : epoch;

    return totpGenerateSync({
      secret: secretBytes,
      algorithm: opts.algorithm,
      digits: opts.digits as Digits,
      period: opts.step,
      epoch: epochSeconds,
      t0: 0,
      crypto: opts.crypto,
      guardrails: opts.guardrails,
    });
  }

  /**
   * Check if a token is valid for the given Base32 secret
   *
   * @param token - The token to verify
   * @param secret - Base32-encoded secret
   * @returns true if valid
   */
  override check(token: string, secret: Base32SecretKey): boolean {
    const delta = this.checkDelta(token, secret);
    return typeof delta === "number";
  }

  /**
   * Check token and return the time window delta
   *
   * @param token - The token to verify
   * @param secret - Base32-encoded secret
   * @returns Window delta (0 = current, positive = future, negative = past), null if invalid
   */
  override checkDelta(token: string, secret: Base32SecretKey): number | null {
    const opts = this.allOptions();
    const secretBytes = defaultBase32.decode(secret);
    const epoch = opts.epoch;
    const epochSeconds = epoch >= 1e12 ? Math.floor(epoch / 1000) : epoch;
    const step = opts.step;
    const window = opts.window;

    // Convert window (steps) to epochTolerance (seconds)
    let epochTolerance: number | [number, number] = 0;
    if (typeof window === "number") {
      epochTolerance = window * step;
    } else if (Array.isArray(window)) {
      epochTolerance = [window[0] * step, window[1] * step];
    }

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
        guardrails: opts.guardrails,
      });

      if (!result.valid) {
        return null;
      }

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
  override verify(opts: { token: string; secret: Base32SecretKey }): boolean {
    if (typeof opts !== "object") {
      throw new Error("Expecting argument 0 of verify to be an object");
    }
    return this.check(opts.token, opts.secret);
  }

  /**
   * Encode a raw secret to Base32
   *
   * @param secret - Raw secret string
   * @returns Base32-encoded secret
   */
  encode(secret: SecretKey): Base32SecretKey {
    const opts = this.allOptions();
    if (opts.keyEncoder) {
      return opts.keyEncoder(secret, opts.encoding);
    }
    return defaultKeyEncoder(secret, opts.encoding);
  }

  /**
   * Decode a Base32 secret to raw string
   *
   * @param secret - Base32-encoded secret
   * @returns Raw secret string
   */
  decode(secret: Base32SecretKey): SecretKey {
    const opts = this.allOptions();
    if (opts.keyDecoder) {
      return opts.keyDecoder(secret, opts.encoding);
    }
    return defaultKeyDecoder(secret, opts.encoding);
  }

  /**
   * Generate a random Base32-encoded secret
   *
   * @param numberOfBytes - Number of bytes for the secret (default: 20)
   * @returns Base32-encoded secret
   */
  generateSecret(numberOfBytes: number = 20): Base32SecretKey {
    const opts = this.allOptions();
    return generateSecretCore({
      crypto: opts.crypto,
      base32: opts.base32,
      length: numberOfBytes,
    });
  }
}
