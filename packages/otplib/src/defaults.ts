/**
 * Default plugin instances
 *
 * Shared across functional and class APIs to ensure singleton behavior
 * and reduce memory overhead. Uses pre-instantiated frozen singletons
 * from the plugin packages.
 */
import { createGuardrails } from "@otplib/core";
import { base32 as defaultBase32 } from "@otplib/plugin-base32-scure";
import { crypto as defaultCrypto } from "@otplib/plugin-crypto-noble";

import type {
  OTPGenerateOptions,
  OTPVerifyOptions,
  OTPGenerateOptionsWithDefaults,
  OTPVerifyOptionsWithDefaults,
} from "./types.js";

export { defaultCrypto, defaultBase32 };

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
    guardrails: options.guardrails ?? createGuardrails(),
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
