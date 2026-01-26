/**
 * @otplib/preset-v11
 *
 * v11-compatible TOTP class implementation.
 */

import { base32 as defaultBase32 } from "@otplib/plugin-base32-scure";
import { crypto as defaultCrypto } from "@otplib/plugin-crypto-noble";
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

export class TOTP<T extends TOTPOptions = TOTPOptions> extends HOTP<T> {
  constructor(defaultOptions: Partial<T> = {}) {
    super(defaultOptions);
  }

  override create(defaultOptions: Partial<T> = {}): TOTP<T> {
    return new TOTP<T>(defaultOptions);
  }

  override allOptions(): Readonly<ResolvedTOTPOptions> {
    const merged = {
      algorithm: HashAlgorithms.SHA1,
      digits: 6,
      encoding: KeyEncodingsConst.ASCII,
      epoch: null, // v11 default was null, meaning "now"
      step: 30,
      window: 0,
      crypto: defaultCrypto,
      base32: defaultBase32,
      ...this._defaultOptions,
      ...this._options,
    };

    // Resolve epoch to seconds if null
    const epoch = merged.epoch !== null ? merged.epoch : Math.floor(Date.now() / 1000);

    return Object.freeze({
      ...merged,
      epoch: epoch as number,
    }) as Readonly<ResolvedTOTPOptions>;
  }

  generate(secret: SecretKey): string {
    const opts = this.allOptions();
    const secretBytes = secretToBytes(secret, opts.encoding);

    return totpGenerateSync({
      secret: secretBytes,
      algorithm: opts.algorithm,
      digits: opts.digits as Digits,
      period: opts.step,
      epoch: opts.epoch, // v11: already in seconds
      t0: 0,
      crypto: opts.crypto,
      guardrails: opts.guardrails,
    });
  }

  check(token: string, secret: SecretKey): boolean {
    const delta = this.checkDelta(token, secret);
    return typeof delta === "number";
  }

  checkDelta(token: string, secret: SecretKey): number | null {
    const opts = this.allOptions();
    const secretBytes = secretToBytes(secret, opts.encoding);
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

  override verify(opts: { token: string; secret: SecretKey }): boolean {
    if (typeof opts !== "object") {
      throw new Error("Expecting argument 0 of verify to be an object");
    }
    return this.check(opts.token, opts.secret);
  }

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

  timeUsed(): number {
    const opts = this.allOptions();
    return opts.epoch % opts.step;
  }

  timeRemaining(): number {
    const opts = this.allOptions();
    return getRemainingTime(opts.epoch, opts.step, 0);
  }
}
