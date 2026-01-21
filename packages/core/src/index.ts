export type {
  Base32EncodeOptions,
  Base32Plugin,
  CryptoPlugin,
  Digits,
  HashAlgorithm,
  SecretOptions,
  OTPResult,
  OTPResultOk,
  OTPResultError,
} from "./types.js";

export type { OTPGuardrailsConfig, OTPGuardrails } from "./utils.js";

export {
  OTPError,
  SecretError,
  SecretTooShortError,
  SecretTooLongError,
  CounterError,
  CounterNegativeError,
  CounterOverflowError,
  TimeError,
  TimeNegativeError,
  PeriodError,
  PeriodTooSmallError,
  PeriodTooLargeError,
  DigitsError,
  AlgorithmError,
  TokenError,
  TokenLengthError,
  TokenFormatError,
  CryptoError,
  HMACError,
  RandomBytesError,
  Base32Error,
  Base32EncodeError,
  Base32DecodeError,
  CounterToleranceError,
  CounterToleranceTooLargeError,
  CounterToleranceNegativeError,
  EpochToleranceError,
  EpochToleranceNegativeError,
  EpochToleranceTooLargeError,
  PluginError,
  CryptoPluginMissingError,
  Base32PluginMissingError,
  ConfigurationError,
  SecretMissingError,
  LabelMissingError,
  IssuerMissingError,
  SecretTypeError,
  AfterTimeStepError,
  AfterTimeStepNegativeError,
  AfterTimeStepNotIntegerError,
  AfterTimeStepRangeExceededError,
  type OTPErrorOptions,
} from "./errors.js";

export {
  createGuardrails,
  hasGuardrailOverrides,
  validateSecret,
  validateCounter,
  validateTime,
  validatePeriod,
  validateToken,
  validateCounterTolerance,
  validateEpochTolerance,
  counterToBytes,
  dynamicTruncate,
  truncateDigits,
  validateByteLengthEqual,
  constantTimeEqual,
  getDigestSize,
  stringToBytes,
  bytesToString,
  normalizeSecret,
  normalizeCounterTolerance,
  normalizeEpochTolerance,
  generateSecret,
  requireCryptoPlugin,
  requireBase32Plugin,
  requireSecret,
  requireLabel,
  requireIssuer,
  requireBase32String,
  wrapResult,
  wrapResultAsync,
  MIN_SECRET_BYTES,
  MAX_SECRET_BYTES,
  RECOMMENDED_SECRET_BYTES,
  MIN_PERIOD,
  MAX_PERIOD,
  DEFAULT_PERIOD,
  MAX_COUNTER,
  MAX_WINDOW,
} from "./utils.js";

export { CryptoContext, createCryptoContext } from "./crypto-context.js";

export { Base32Context, createBase32Context } from "./base32-context.js";

export { createBase32Plugin, createCryptoPlugin } from "./plugin-factories.js";

export type { CreateBase32PluginOptions, CreateCryptoPluginOptions } from "./plugin-factories.js";

// Utility types for enhanced developer experience
export type {
  Brand,
  Base32Secret,
  OTPToken,
  RequireKeys,
  OptionalKeys,
  PluginConfig,
  WithRequiredPlugins,
  GenerationReady,
  NarrowBy,
} from "./utility-types.js";

export { hasPlugins, hasCrypto, hasBase32 } from "./utility-types.js";
