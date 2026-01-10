/**
 * Default plugin instances
 *
 * Shared across functional and class APIs to ensure singleton behavior
 * and reduce memory overhead.
 */
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";

import type {
  OTPGenerateOptions,
  OTPVerifyOptions,
  OTPGenerateOptionsWithDefaults,
  OTPVerifyOptionsWithDefaults,
} from "./types";

/**
 * Default crypto plugin instance (Noble Hashes)
 *
 * This plugin provides cross-platform cryptographic operations
 * using the @noble/hashes library.
 */
export const defaultCrypto = Object.freeze(new NobleCryptoPlugin());

/**
 * Default Base32 plugin instance (@scure/base)
 *
 * This plugin provides Base32 encoding/decoding operations
 * using the @scure/base library.
 */
export const defaultBase32 = Object.freeze(new ScureBase32Plugin());

export function normalizeGenerateOptions(
  options: OTPGenerateOptions,
): OTPGenerateOptionsWithDefaults {
  return {
    secret: options.secret,
    strategy: options.strategy ?? "totp",
    crypto: options.crypto ?? defaultCrypto,
    base32: options.base32 ?? defaultBase32,
    algorithm: options.algorithm ?? "sha1",
    digits: options.digits ?? 6,
    period: options.period ?? 30,
    epoch: options.epoch ?? Math.floor(Date.now() / 1000),
    t0: options.t0 ?? 0,
    counter: options.counter,
  };
}

export function normalizeVerifyOptions(options: OTPVerifyOptions): OTPVerifyOptionsWithDefaults {
  return {
    ...normalizeGenerateOptions(options),
    token: options.token,
    epochTolerance: options.epochTolerance ?? 0,
    counterTolerance: options.counterTolerance ?? 0,
  };
}
