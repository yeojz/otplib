export type {
  OTPAuthOptions,
  TOTPOptions,
  OTPGenerateOptions as OTPFunctionalOptions,
  OTPVerifyOptions as OTPVerifyFunctionalOptions,
} from "./types";

export {
  generateSecret,
  generateURI,
  generate,
  generateSync,
  verify,
  verifySync,
  type OTPStrategy,
} from "./functional";

export {
  OTP,
  type OTPClassOptions,
  type OTPGenerateOptions,
  type OTPVerifyOptions,
  type OTPURIGenerateOptions,
} from "./class";

export type { Base32Plugin, CryptoPlugin, HashAlgorithm, OTPResult } from "@otplib/core";
export type { VerifyResult } from "@otplib/totp";

export { HOTP } from "@otplib/hotp";
export { TOTP } from "@otplib/totp";

// Result wrapping utilities
export { wrapResult, wrapResultAsync } from "@otplib/core";

// Default Plugins
export { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
export { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
