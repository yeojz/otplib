/**
 * @otplib/preset-v11
 *
 * v11-compatible type definitions.
 * v11 used functionality similar to v12 but with seconds-based epochs.
 */

import type { CryptoPlugin, Base32Plugin, HashAlgorithm, OTPGuardrails } from "@otplib/core";

export const HashAlgorithms = {
  SHA1: "sha1",
  SHA256: "sha256",
  SHA512: "sha512",
} as const;

export type HashAlgorithms = (typeof HashAlgorithms)[keyof typeof HashAlgorithms];

export const KeyEncodings = {
  ASCII: "ascii",
  HEX: "hex",
  BASE32: "base32",
  BASE64: "base64",
  LATIN1: "latin1",
  UTF8: "utf8",
} as const;

export type KeyEncodings = (typeof KeyEncodings)[keyof typeof KeyEncodings];

export type SecretKey = string;
export type Base32SecretKey = string;

export type HOTPOptions = {
  algorithm?: HashAlgorithm;
  digits?: number;
  encoding?: KeyEncodings;
  crypto?: CryptoPlugin;
  base32?: Base32Plugin;
  guardrails?: OTPGuardrails;
};

export type TOTPOptions = HOTPOptions & {
  epoch?: number | null; // v11: seconds
  step?: number;
  window?: number | [number, number];
};

export type KeyEncoder = (secret: SecretKey, encoding: KeyEncodings) => Base32SecretKey;
export type KeyDecoder = (encodedSecret: Base32SecretKey, encoding: KeyEncodings) => SecretKey;

export type AuthenticatorOptions = TOTPOptions & {
  keyEncoder?: KeyEncoder;
  keyDecoder?: KeyDecoder;
};

export type ResolvedHOTPOptions = {
  algorithm: HashAlgorithm;
  digits: number;
  encoding: KeyEncodings;
  crypto: CryptoPlugin;
  base32: Base32Plugin;
  guardrails?: OTPGuardrails;
};

export type ResolvedTOTPOptions = ResolvedHOTPOptions & {
  epoch: number;
  step: number;
  window: number | [number, number];
};

export type ResolvedAuthenticatorOptions = ResolvedTOTPOptions & {
  keyEncoder: KeyEncoder;
  keyDecoder: KeyDecoder;
};
