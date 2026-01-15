/**
 * Options for OTPError construction
 */
export type OTPErrorOptions = {
  /**
   * The underlying error that caused this error.
   * Useful for error chaining and debugging.
   */
  cause?: unknown;
};

/**
 * Base error class for all otplib errors
 *
 * Supports ES2022 error chaining via the `cause` property.
 *
 * @example
 * ```typescript
 * try {
 *   // ... operation that throws
 * } catch (error) {
 *   throw new OTPError('Operation failed', { cause: error });
 * }
 * ```
 */
export class OTPError extends Error {
  constructor(message: string, options?: OTPErrorOptions) {
    super(message, options);
    this.name = "OTPError";
  }
}

/**
 * Error thrown when secret validation fails
 */
export class SecretError extends OTPError {
  constructor(message: string) {
    super(message);
    this.name = "SecretError";
  }
}

/**
 * Error thrown when secret is too short (< 128 bits)
 */
export class SecretTooShortError extends SecretError {
  constructor(minBytes: number, actualBytes: number) {
    super(
      `Secret must be at least ${minBytes} bytes (${minBytes * 8} bits), got ${actualBytes} bytes`,
    );
    this.name = "SecretTooShortError";
  }
}

/**
 * Error thrown when secret is unreasonably large (> 64 bytes)
 */
export class SecretTooLongError extends SecretError {
  constructor(maxBytes: number, actualBytes: number) {
    super(`Secret must not exceed ${maxBytes} bytes, got ${actualBytes} bytes`);
    this.name = "SecretTooLongError";
  }
}

/**
 * Error thrown when counter is invalid
 */
export class CounterError extends OTPError {
  constructor(message: string) {
    super(message);
    this.name = "CounterError";
  }
}

/**
 * Error thrown when counter is negative
 */
export class CounterNegativeError extends CounterError {
  constructor() {
    super("Counter must be non-negative");
    this.name = "CounterNegativeError";
  }
}

/**
 * Error thrown when counter exceeds maximum value (2^53 - 1 for safe integer)
 */
export class CounterOverflowError extends CounterError {
  constructor() {
    super("Counter exceeds maximum safe integer value");
    this.name = "CounterOverflowError";
  }
}

/**
 * Error thrown when time is invalid
 */
export class TimeError extends OTPError {
  constructor(message: string) {
    super(message);
    this.name = "TimeError";
  }
}

/**
 * Error thrown when time is negative
 */
export class TimeNegativeError extends TimeError {
  constructor() {
    super("Time must be non-negative");
    this.name = "TimeNegativeError";
  }
}

/**
 * Error thrown when period is invalid
 */
export class PeriodError extends OTPError {
  constructor(message: string) {
    super(message);
    this.name = "PeriodError";
  }
}

/**
 * Error thrown when period is too small
 */
export class PeriodTooSmallError extends PeriodError {
  constructor(minPeriod: number) {
    super(`Period must be at least ${minPeriod} second(s)`);
    this.name = "PeriodTooSmallError";
  }
}

/**
 * Error thrown when period is too large
 */
export class PeriodTooLargeError extends PeriodError {
  constructor(maxPeriod: number) {
    super(`Period must not exceed ${maxPeriod} seconds`);
    this.name = "PeriodTooLargeError";
  }
}

/**
 * Error thrown when digits value is invalid
 */
export class DigitsError extends OTPError {
  constructor(message: string) {
    super(message);
    this.name = "DigitsError";
  }
}

/**
 * Error thrown when hash algorithm is invalid
 */
export class AlgorithmError extends OTPError {
  constructor(message: string) {
    super(message);
    this.name = "AlgorithmError";
  }
}

/**
 * Error thrown when token is invalid
 */
export class TokenError extends OTPError {
  constructor(message: string) {
    super(message);
    this.name = "TokenError";
  }
}

/**
 * Error thrown when token has incorrect length
 */
export class TokenLengthError extends TokenError {
  constructor(expected: number, actual: number) {
    super(`Token must be ${expected} digits, got ${actual}`);
    this.name = "TokenLengthError";
  }
}

/**
 * Error thrown when token contains non-digit characters
 */
export class TokenFormatError extends TokenError {
  constructor() {
    super("Token must contain only digits");
    this.name = "TokenFormatError";
  }
}

/**
 * Error thrown when crypto operation fails
 */
export class CryptoError extends OTPError {
  constructor(message: string, options?: OTPErrorOptions) {
    super(message, options);
    this.name = "CryptoError";
  }
}

/**
 * Error thrown when HMAC computation fails
 *
 * The original error from the crypto plugin is available via `cause`.
 *
 * @example
 * ```typescript
 * try {
 *   await cryptoContext.hmac('sha1', key, data);
 * } catch (error) {
 *   if (error instanceof HMACError) {
 *     console.log('HMAC failed:', error.message);
 *     console.log('Original error:', error.cause);
 *   }
 * }
 * ```
 */
export class HMACError extends CryptoError {
  constructor(message: string, options?: OTPErrorOptions) {
    super(`HMAC computation failed: ${message}`, options);
    this.name = "HMACError";
  }
}

/**
 * Error thrown when random byte generation fails
 *
 * The original error from the crypto plugin is available via `cause`.
 */
export class RandomBytesError extends CryptoError {
  constructor(message: string, options?: OTPErrorOptions) {
    super(`Random byte generation failed: ${message}`, options);
    this.name = "RandomBytesError";
  }
}

/**
 * Error thrown when Base32 operation fails
 */
export class Base32Error extends OTPError {
  constructor(message: string, options?: OTPErrorOptions) {
    super(message, options);
    this.name = "Base32Error";
  }
}

/**
 * Error thrown when Base32 encoding fails
 *
 * The original error from the Base32 plugin is available via `cause`.
 *
 * @example
 * ```typescript
 * try {
 *   base32Context.encode(data);
 * } catch (error) {
 *   if (error instanceof Base32EncodeError) {
 *     console.log('Encoding failed:', error.message);
 *     console.log('Original error:', error.cause);
 *   }
 * }
 * ```
 */
export class Base32EncodeError extends Base32Error {
  constructor(message: string, options?: OTPErrorOptions) {
    super(`Base32 encoding failed: ${message}`, options);
    this.name = "Base32EncodeError";
  }
}

/**
 * Error thrown when Base32 decoding fails
 *
 * The original error from the Base32 plugin is available via `cause`.
 *
 * @example
 * ```typescript
 * try {
 *   base32Context.decode(invalidString);
 * } catch (error) {
 *   if (error instanceof Base32DecodeError) {
 *     console.log('Decoding failed:', error.message);
 *     console.log('Original error:', error.cause);
 *   }
 * }
 * ```
 */
export class Base32DecodeError extends Base32Error {
  constructor(message: string, options?: OTPErrorOptions) {
    super(`Base32 decoding failed: ${message}`, options);
    this.name = "Base32DecodeError";
  }
}

/**
 * Error thrown when counter tolerance is invalid
 */
export class CounterToleranceError extends OTPError {
  constructor(message: string) {
    super(message);
    this.name = "CounterToleranceError";
  }
}

/**
 * Error thrown when counter tolerance is too large
 */
export class CounterToleranceTooLargeError extends CounterToleranceError {
  constructor(maxWindow: number, totalChecks: number) {
    super(
      `Counter tolerance validation failed: total checks (${totalChecks}) exceeds MAX_WINDOW (${maxWindow})`,
    );
    this.name = "CounterToleranceTooLargeError";
  }
}

/**
 * Error thrown when epoch tolerance is invalid
 */
export class EpochToleranceError extends OTPError {
  constructor(message: string) {
    super(message);
    this.name = "EpochToleranceError";
  }
}

/**
 * Error thrown when epoch tolerance contains negative values
 */
export class EpochToleranceNegativeError extends EpochToleranceError {
  constructor() {
    super("Epoch tolerance cannot contain negative values");
    this.name = "EpochToleranceNegativeError";
  }
}

/**
 * Error thrown when epoch tolerance is too large
 */
export class EpochToleranceTooLargeError extends EpochToleranceError {
  constructor(maxTolerance: number, actualValue: number) {
    super(
      `Epoch tolerance must not exceed ${maxTolerance} seconds, got ${actualValue}. ` +
        `Large tolerances can cause performance issues.`,
    );
    this.name = "EpochToleranceTooLargeError";
  }
}

/**
 * Error thrown when a required plugin is missing
 */
export class PluginError extends OTPError {
  constructor(message: string) {
    super(message);
    this.name = "PluginError";
  }
}

/**
 * Error thrown when crypto plugin is not configured
 */
export class CryptoPluginMissingError extends PluginError {
  constructor() {
    super("Crypto plugin is required.");
    this.name = "CryptoPluginMissingError";
  }
}

/**
 * Error thrown when Base32 plugin is not configured
 */
export class Base32PluginMissingError extends PluginError {
  constructor() {
    super("Base32 plugin is required.");
    this.name = "Base32PluginMissingError";
  }
}

/**
 * Error thrown when required configuration is missing
 */
export class ConfigurationError extends OTPError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/**
 * Error thrown when secret is not configured
 */
export class SecretMissingError extends ConfigurationError {
  constructor() {
    super(
      "Secret is required. " +
        "Use generateSecret() to create one, or provide via { secret: 'YOUR_BASE32_SECRET' }",
    );
    this.name = "SecretMissingError";
  }
}

/**
 * Error thrown when label is not configured (required for URI generation)
 */
export class LabelMissingError extends ConfigurationError {
  constructor() {
    super("Label is required for URI generation. Example: { label: 'user@example.com' }");
    this.name = "LabelMissingError";
  }
}

/**
 * Error thrown when issuer is not configured (required for URI generation)
 */
export class IssuerMissingError extends ConfigurationError {
  constructor() {
    super("Issuer is required for URI generation. Example: { issuer: 'MyApp' }");
    this.name = "IssuerMissingError";
  }
}

/**
 * Error thrown when secret must be a Base32 string but is provided as bytes
 */
export class SecretTypeError extends ConfigurationError {
  constructor() {
    super(
      "Class API requires secret to be a Base32 string, not Uint8Array. " +
        "Use generateSecret() or provide a Base32-encoded string.",
    );
    this.name = "SecretTypeError";
  }
}
