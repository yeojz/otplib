/**
 * @otplib/preset-v11
 *
 * v11-compatible HOTP class implementation.
 */

import { stringToBytes, createGuardrails } from "@otplib/core";
import { generateSync as hotpGenerateSync, verifySync as hotpVerifySync } from "@otplib/hotp";
import { base32 as defaultBase32 } from "@otplib/plugin-base32-scure";
import { crypto as defaultCrypto } from "@otplib/plugin-crypto-noble";
import { generateHOTP as generateHOTPURI } from "@otplib/uri";
import { base64, hex } from "@scure/base";

import { HashAlgorithms, KeyEncodings as KeyEncodingsConst } from "./types.js";

import type { HOTPOptions, SecretKey, ResolvedHOTPOptions } from "./types.js";
import type { Digits } from "@otplib/core";

/**
 * Convert a string to bytes by taking the low byte of each UTF-16 code unit.
 *
 * Matches Node's `Buffer.from(str, "latin1")` semantics. Per Node's docs,
 * `Buffer.from(str, "ascii")` uses this same conversion when encoding a
 * string to bytes, so this is reused for both `latin1` and `ascii`.
 *
 * Implemented without `Buffer` so the adapters stay cross-runtime.
 */
function latin1ToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) {
    bytes[i] = value.charCodeAt(i) & 0xff;
  }
  return bytes;
}

/**
 * Convert a string secret to bytes based on encoding.
 *
 * Mirrors the semantics of Node's `Buffer.from(secret, encoding)`, which is
 * what the original v11/v12 implementations relied on:
 *  - `base32`: RFC 4648 Base32 decode.
 *  - `hex`: hex decode (whitespace stripped, as v11/v12 tests expect).
 *  - `base64`: standard (padded) Base64 decode.
 *  - `latin1` / `ascii`: low byte of each UTF-16 code unit.
 *  - `utf8`, any other/unrecognised encoding, or `undefined`: UTF-8 bytes.
 */
export function secretToBytes(secret: SecretKey, encoding?: string): Uint8Array {
  if (encoding === KeyEncodingsConst.BASE32 || encoding === "base32") {
    return defaultBase32.decode(secret);
  }
  if (encoding === KeyEncodingsConst.HEX || encoding === "hex") {
    return hex.decode(secret.replace(/\s/g, ""));
  }
  if (encoding === KeyEncodingsConst.BASE64 || encoding === "base64") {
    return base64.decode(secret);
  }
  if (
    encoding === KeyEncodingsConst.LATIN1 ||
    encoding === "latin1" ||
    encoding === KeyEncodingsConst.ASCII ||
    encoding === "ascii"
  ) {
    return latin1ToBytes(secret);
  }
  return stringToBytes(secret);
}

export class HOTP<T extends HOTPOptions = HOTPOptions> {
  protected _options: Partial<T> = {};
  protected _defaultOptions: Partial<T> = {};

  constructor(defaultOptions: Partial<T> = {}) {
    this._defaultOptions = {
      ...defaultOptions,
      guardrails: createGuardrails(defaultOptions.guardrails),
    } as Partial<T>;
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
    this._defaultOptions = { ...value };
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
      guardrails: opts.guardrails,
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
        guardrails: opts.guardrails,
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
