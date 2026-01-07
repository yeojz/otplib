/**
 * @otplib/preset-v11
 *
 * v11-compatible Authenticator class implementation.
 */

import { generateSecret as generateSecretCore } from "@otplib/core";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { generateSync as totpGenerateSync, verifySync as totpVerifySync } from "@otplib/totp";

import { TOTP } from "./totp";
import { HashAlgorithms, KeyEncodings as KeyEncodingsConst } from "./types";

import type {
  AuthenticatorOptions,
  Base32SecretKey,
  SecretKey,
  KeyEncodings,
  ResolvedAuthenticatorOptions,
} from "./types";
import type { Digits } from "@otplib/core";

const defaultCrypto = new NobleCryptoPlugin();
const defaultBase32 = new ScureBase32Plugin();

function defaultKeyEncoder(secret: SecretKey, _encoding: KeyEncodings): Base32SecretKey {
  const bytes = new TextEncoder().encode(secret);
  return defaultBase32.encode(bytes);
}

function defaultKeyDecoder(encodedSecret: Base32SecretKey, _encoding: KeyEncodings): SecretKey {
  const bytes = defaultBase32.decode(encodedSecret);
  return new TextDecoder().decode(bytes);
}

function parseWindow(
  window: number | [number, number] | undefined,
  step: number,
): number | [number, number] {
  if (window === undefined || window === 0) {
    return 0;
  }
  if (typeof window === "number") {
    // v11 treated window as steps
    return window * step;
  }
  return [window[0] * step, window[1] * step];
}

export class Authenticator<T extends AuthenticatorOptions = AuthenticatorOptions> extends TOTP<T> {
  constructor(defaultOptions: Partial<T> = {}) {
    super(defaultOptions);
  }

  override create(defaultOptions: Partial<T> = {}): Authenticator<T> {
    return new Authenticator<T>(defaultOptions);
  }

  override allOptions(): Readonly<ResolvedAuthenticatorOptions> {
    const merged = {
      algorithm: HashAlgorithms.SHA1,
      digits: 6,
      encoding: KeyEncodingsConst.HEX,
      epoch: null,
      step: 30,
      window: 0,
      keyEncoder: defaultKeyEncoder,
      keyDecoder: defaultKeyDecoder,
      crypto: defaultCrypto,
      base32: defaultBase32,
      ...this._defaultOptions,
      ...this._options,
    };

    const epoch = merged.epoch !== null ? merged.epoch : Math.floor(Date.now() / 1000);

    return Object.freeze({
      ...merged,
      epoch: epoch as number,
    }) as Readonly<ResolvedAuthenticatorOptions>;
  }

  override generate(secret: Base32SecretKey): string {
    const opts = this.allOptions();

    // Generate using decoded secret (as raw bytes)
    const secretBytes = defaultBase32.decode(secret);

    return totpGenerateSync({
      secret: secretBytes,
      algorithm: opts.algorithm,
      digits: opts.digits as Digits,
      period: opts.step,
      epoch: opts.epoch, // v11: already in seconds
      t0: 0,
      crypto: opts.crypto,
    });
  }

  override check(token: string, secret: Base32SecretKey): boolean {
    const delta = this.checkDelta(token, secret);
    return typeof delta === "number";
  }

  override checkDelta(token: string, secret: Base32SecretKey): number | null {
    const opts = this.allOptions();
    const secretBytes = defaultBase32.decode(secret);
    const epochTolerance = parseWindow(opts.window, opts.step);

    try {
      const result = totpVerifySync({
        secret: secretBytes,
        token,
        algorithm: opts.algorithm,
        digits: opts.digits as Digits,
        period: opts.step,
        epoch: opts.epoch, // v11: already in seconds
        t0: 0,
        epochTolerance,
        crypto: opts.crypto,
      });

      if (!result.valid) {
        return null;
      }

      return result.delta;
    } catch {
      return null;
    }
  }

  override verify(opts: { token: string; secret: Base32SecretKey }): boolean {
    if (typeof opts !== "object") {
      // v11 legacy behavior: verify requires object
      throw new Error("Expecting argument 0 of verify to be an object");
    }
    return this.check(opts.token, opts.secret);
  }

  encode(secret: SecretKey): Base32SecretKey {
    const opts = this.allOptions();
    return opts.keyEncoder(secret, opts.encoding);
  }

  decode(secret: Base32SecretKey): SecretKey {
    const opts = this.allOptions();
    return opts.keyDecoder(secret, opts.encoding);
  }

  generateSecret(numberOfBytes: number = 20): Base32SecretKey {
    const opts = this.allOptions();
    return generateSecretCore({
      crypto: opts.crypto,
      base32: opts.base32,
      length: numberOfBytes,
    });
  }
}
