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
  OTPGenerateCommonOptions,
  OTPVerifyCommonOptions,
  TOTPGenerateOptions,
  HOTPGenerateOptions,
  TOTPVerifyOptions,
  HOTPVerifyOptions,
  TOTPGenerateOptionsWithDefaults,
  HOTPGenerateOptionsWithDefaults,
  TOTPVerifyOptionsWithDefaults,
  HOTPVerifyOptionsWithDefaults,
} from "./types.js";

export { defaultCrypto, defaultBase32 };

function normalizeGenerateCommonOptions(options: OTPGenerateCommonOptions) {
  return {
    secret: options.secret,
    crypto: options.crypto ?? defaultCrypto,
    base32: options.base32 ?? defaultBase32,
    algorithm: options.algorithm ?? "sha1",
    digits: options.digits ?? 6,
    period: options.period ?? 30,
    epoch: options.epoch ?? Math.floor(Date.now() / 1000),
    t0: options.t0 ?? 0,
    guardrails: options.guardrails ?? createGuardrails(),
    hooks: options.hooks,
  };
}

function normalizeVerifyCommonOptions(options: OTPVerifyCommonOptions) {
  return {
    ...normalizeGenerateCommonOptions(options),
    token: options.token,
    epochTolerance: options.epochTolerance ?? 0,
    counterTolerance: options.counterTolerance ?? 0,
    afterTimeStep: options.afterTimeStep,
    format: options.format,
  };
}

export function normalizeTOTPGenerateOptions(
  options: TOTPGenerateOptions,
): TOTPGenerateOptionsWithDefaults {
  return {
    ...normalizeGenerateCommonOptions(options),
    strategy: "totp",
    counter: options.counter,
    format: options.format,
  };
}

export function normalizeHOTPGenerateOptions(
  options: HOTPGenerateOptions,
): HOTPGenerateOptionsWithDefaults {
  return {
    ...normalizeGenerateCommonOptions(options),
    strategy: "hotp",
    counter: options.counter,
    format: options.format,
  };
}

export function normalizeTOTPVerifyOptions(
  options: TOTPVerifyOptions,
): TOTPVerifyOptionsWithDefaults {
  return {
    ...normalizeVerifyCommonOptions(options),
    strategy: "totp",
    counter: options.counter,
  };
}

export function normalizeHOTPVerifyOptions(
  options: HOTPVerifyOptions,
): HOTPVerifyOptionsWithDefaults {
  return {
    ...normalizeVerifyCommonOptions(options),
    strategy: "hotp",
    counter: options.counter,
  };
}
