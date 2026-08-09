/**
 * Default plugin instances
 *
 * Shared across functional and class APIs to ensure singleton behavior
 * and reduce memory overhead. Uses pre-instantiated frozen singletons
 * from the plugin packages.
 */
import { createGuardrails, normalizeHashAlgorithm } from "@otplib/core";
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
  // Hoisted so the algorithm can be checked against this plugin's own set.
  const crypto = options.crypto ?? defaultCrypto;

  return {
    secret: options.secret,
    strategy: options.strategy ?? "totp",
    crypto,
    base32: options.base32 ?? defaultBase32,
    // Case-fold at the public API boundary: untyped JS callers may pass 'SHA1'.
    // A plugin supporting fewer algorithms reports what it actually accepts
    // rather than the full set.
    algorithm: normalizeHashAlgorithm(options.algorithm ?? "sha1", {
      supported: crypto.algorithms,
      plugin: crypto.name,
    }),
    digits: options.digits ?? 6,
    period: options.period ?? 30,
    epoch: options.epoch ?? Math.floor(Date.now() / 1000),
    t0: options.t0 ?? 0,
    counter: options.counter,
    guardrails: options.guardrails ?? createGuardrails(),
    hooks: options.hooks,
  };
}

export function normalizeVerifyOptions(options: OTPVerifyOptions): OTPVerifyOptionsWithDefaults {
  return {
    ...normalizeGenerateOptions(options),
    token: options.token,
    epochTolerance: options.epochTolerance ?? 0,
    counterTolerance: options.counterTolerance ?? 0,
    afterTimeStep: options.afterTimeStep,
  };
}
