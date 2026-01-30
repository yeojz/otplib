export type {
  OTPAuthOptions,
  TOTPOptions,
  OTPGenerateOptions as OTPFunctionalOptions,
  OTPVerifyOptions as OTPVerifyFunctionalOptions,
} from "./types.js";

export {
  generateSecret,
  generateURI,
  generate,
  generateSync,
  verify,
  verifySync,
  type OTPStrategy,
} from "./functional.js";

export {
  OTP,
  type OTPClassOptions,
  type OTPGenerateOptions,
  type OTPVerifyOptions,
  type OTPURIGenerateOptions,
} from "./class.js";

export type {
  Base32Plugin,
  CryptoPlugin,
  HashAlgorithm,
  OTPResult,
  OTPGuardrails,
  OTPGuardrailsConfig,
} from "@otplib/core";
export type { VerifyResult } from "@otplib/totp";

export { HOTP } from "@otplib/hotp";
export { TOTP } from "@otplib/totp";

export { createGuardrails, stringToBytes, wrapResult, wrapResultAsync } from "@otplib/core";

// Default Plugins
export { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
export { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
