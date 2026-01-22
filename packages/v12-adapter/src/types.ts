/**
 * @otplib/v12-adapter
 *
 * v12-compatible type definitions for migration adapter.
 * These types mirror the v12 API to provide drop-in compatibility.
 */

import type { CryptoPlugin, Base32Plugin, HashAlgorithm, OTPGuardrails } from "@otplib/core";

/**
 * v12-style hash algorithms constant
 */
export const HashAlgorithms = {
  SHA1: "sha1",
  SHA256: "sha256",
  SHA512: "sha512",
} as const;

export type HashAlgorithms = (typeof HashAlgorithms)[keyof typeof HashAlgorithms];

/**
 * v12-style key encodings constant
 */
export const KeyEncodings = {
  ASCII: "ascii",
  HEX: "hex",
  BASE32: "base32",
  BASE64: "base64",
  LATIN1: "latin1",
  UTF8: "utf8",
} as const;

export type KeyEncodings = (typeof KeyEncodings)[keyof typeof KeyEncodings];

/**
 * v12-style secret key type (string-based)
 */
export type SecretKey = string;

/**
 * Base32 encoded secret key
 */
export type Base32SecretKey = string;

/**
 * v12-style createDigest function signature
 */
export type CreateDigest<T = string> = (algorithm: HashAlgorithm, hmacKey: T, counter: T) => T;

/**
 * v12-style createHmacKey function signature
 */
export type CreateHmacKey<T = string> = (
  algorithm: HashAlgorithm,
  secret: SecretKey,
  encoding: KeyEncodings,
) => T;

/**
 * v12-style createRandomBytes function signature
 */
export type CreateRandomBytes<T = string> = (size: number, encoding: KeyEncodings) => T;

/**
 * v12-style keyEncoder function signature
 */
export type KeyEncoder<T = Base32SecretKey> = (secret: SecretKey, encoding: KeyEncodings) => T;

/**
 * v12-style keyDecoder function signature
 */
export type KeyDecoder<T = SecretKey> = (
  encodedSecret: Base32SecretKey,
  encoding: KeyEncodings,
) => T;

/**
 * v12-compatible HOTP options
 */
export type HOTPOptions<T = string> = {
  /** Algorithm for HMAC (default: sha1) */
  algorithm?: HashAlgorithm;
  /** Creates the digest for token generation */
  createDigest?: CreateDigest<T>;
  /** Formats the secret into HMAC key */
  createHmacKey?: CreateHmacKey<T>;
  /** Number of digits in token (default: 6) */
  digits?: number;
  /** Secret encoding (default: ascii) */
  encoding?: KeyEncodings;
  /** Pre-computed digest (use with caution) */
  digest?: string;
  /** v13 crypto plugin (internal use) */
  crypto?: CryptoPlugin;
  /** v13 base32 plugin (internal use) */
  base32?: Base32Plugin;
  /** Validation guardrails */
  guardrails?: OTPGuardrails;
};

/**
 * v12-compatible TOTP options
 */
export type TOTPOptions<T = string> = HOTPOptions<T> & {
  /** Starting epoch in milliseconds (default: Date.now()) */
  epoch?: number;
  /** Time step in seconds (default: 30) */
  step?: number;
  /** Verification window - number of steps or [past, future] */
  window?: number | [number, number];
};

/**
 * v12-compatible Authenticator options
 */
export type AuthenticatorOptions<T = string> = TOTPOptions<T> & {
  /** Encodes secret to Base32 */
  keyEncoder?: KeyEncoder<T>;
  /** Decodes Base32 secret */
  keyDecoder?: KeyDecoder<T>;
  /** Creates random bytes for secret generation */
  createRandomBytes?: CreateRandomBytes<T>;
};

/**
 * Resolved HOTP options with guaranteed defaults
 */
export type ResolvedHOTPOptions = {
  algorithm: HashAlgorithm;
  digits: number;
  encoding: KeyEncodings;
  crypto: CryptoPlugin;
  base32: Base32Plugin;
  guardrails?: OTPGuardrails;
};

/**
 * Resolved TOTP options with guaranteed defaults
 */
export type ResolvedTOTPOptions = ResolvedHOTPOptions & {
  epoch: number;
  step: number;
  window: number | [number, number];
};

/**
 * Resolved Authenticator options with guaranteed defaults
 */
export type ResolvedAuthenticatorOptions = ResolvedTOTPOptions & {
  keyEncoder?: KeyEncoder;
  keyDecoder?: KeyDecoder;
};
