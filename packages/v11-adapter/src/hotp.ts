/**
 * @otplib/preset-v11
 *
 * v11-compatible HOTP class implementation.
 */

import { stringToBytes, hexToBytes } from "@otplib/core";
import { generateSync as hotpGenerateSync, verifySync as hotpVerifySync } from "@otplib/hotp";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { generateHOTP as generateHOTPURI } from "@otplib/uri";

import { HashAlgorithms, KeyEncodings as KeyEncodingsConst } from "./types";

import type { HOTPOptions, SecretKey, ResolvedHOTPOptions } from "./types";
import type { Digits } from "@otplib/core";

const defaultCrypto = new NobleCryptoPlugin();
const defaultBase32 = new ScureBase32Plugin();

/**
 * Convert a string secret to bytes based on encoding
 */
export function secretToBytes(secret: SecretKey, encoding?: string): Uint8Array {
  if (encoding === KeyEncodingsConst.BASE32 || encoding === "base32") {
    return defaultBase32.decode(secret);
  }
  if (encoding === KeyEncodingsConst.HEX || encoding === "hex") {
    return hexToBytes(secret.replace(/\s/g, ""));
  }
  return stringToBytes(secret);
}

export class HOTP<T extends HOTPOptions = HOTPOptions> {
  protected _options: Partial<T> = {};
  protected _defaultOptions: Partial<T> = {};

  constructor(defaultOptions: Partial<T> = {}) {
    this._defaultOptions = { ...defaultOptions };
    this._options = {};
  }

  get options(): Partial<T> {
    return { ...this._defaultOptions, ...this._options };
  }

  set options(value: Partial<T>) {
    this._options = { ...value };
  }

  get defaultOptions(): Partial<T> {
    return this._defaultOptions;
  }

  set defaultOptions(value: Partial<T>) {
    this._defaultOptions = value;
  }

  get optionsAll(): Readonly<ResolvedHOTPOptions> {
    return this.allOptions();
  }

  create(defaultOptions: Partial<T> = {}): HOTP<T> {
    return new HOTP<T>(defaultOptions);
  }

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

  resetOptions(): this {
    this._options = {};
    return this;
  }

  generate(secret: SecretKey, counter: number): string {
    const opts = this.allOptions();
    const secretBytes = secretToBytes(secret, opts.encoding);

    return hotpGenerateSync({
      secret: secretBytes,
      counter,
      algorithm: opts.algorithm,
      digits: opts.digits as Digits,
      crypto: opts.crypto,
    });
  }

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
      });

      return result.valid;
    } catch {
      return false;
    }
  }

  verify(opts: { token: string; secret: SecretKey; counter: number }): boolean {
    if (typeof opts !== "object") {
      throw new Error("Expecting argument 0 of verify to be an object");
    }
    return this.check(opts.token, opts.secret, opts.counter);
  }

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

  getClass(): typeof HOTP {
    return HOTP;
  }
}
