import { describe, it, expect } from "vitest";
import {
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
} from "./errors.js";

describe("OTPError", () => {
  it("should create base error with message", () => {
    const error = new OTPError("Test error");
    expect(error.message).toBe("Test error");
    expect(error.name).toBe("OTPError");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("SecretError", () => {
  it("should create secret error with message", () => {
    const error = new SecretError("Invalid secret");
    expect(error.message).toBe("Invalid secret");
    expect(error.name).toBe("SecretError");
    expect(error).toBeInstanceOf(OTPError);
  });
});

describe("SecretTooShortError", () => {
  it("should create error with correct message", () => {
    const error = new SecretTooShortError(16, 8);
    expect(error.message).toBe("Secret must be at least 16 bytes (128 bits), got 8 bytes");
    expect(error.name).toBe("SecretTooShortError");
    expect(error).toBeInstanceOf(SecretError);
  });
});

describe("SecretTooLongError", () => {
  it("should create error with correct message", () => {
    const error = new SecretTooLongError(64, 128);
    expect(error.message).toBe("Secret must not exceed 64 bytes, got 128 bytes");
    expect(error.name).toBe("SecretTooLongError");
    expect(error).toBeInstanceOf(SecretError);
  });
});

describe("CounterError", () => {
  it("should create counter error with message", () => {
    const error = new CounterError("Invalid counter");
    expect(error.message).toBe("Invalid counter");
    expect(error.name).toBe("CounterError");
    expect(error).toBeInstanceOf(OTPError);
  });
});

describe("CounterNegativeError", () => {
  it("should create error with default message", () => {
    const error = new CounterNegativeError();
    expect(error.message).toBe("Counter must be non-negative");
    expect(error.name).toBe("CounterNegativeError");
    expect(error).toBeInstanceOf(CounterError);
  });
});

describe("CounterOverflowError", () => {
  it("should create error with default message", () => {
    const error = new CounterOverflowError();
    expect(error.message).toBe("Counter exceeds maximum safe integer value");
    expect(error.name).toBe("CounterOverflowError");
    expect(error).toBeInstanceOf(CounterError);
  });
});

describe("TimeError", () => {
  it("should create time error with message", () => {
    const error = new TimeError("Invalid time");
    expect(error.message).toBe("Invalid time");
    expect(error.name).toBe("TimeError");
    expect(error).toBeInstanceOf(OTPError);
  });
});

describe("TimeNegativeError", () => {
  it("should create error with default message", () => {
    const error = new TimeNegativeError();
    expect(error.message).toBe("Time must be non-negative");
    expect(error.name).toBe("TimeNegativeError");
    expect(error).toBeInstanceOf(TimeError);
  });
});

describe("PeriodError", () => {
  it("should create period error with message", () => {
    const error = new PeriodError("Invalid period");
    expect(error.message).toBe("Invalid period");
    expect(error.name).toBe("PeriodError");
    expect(error).toBeInstanceOf(OTPError);
  });
});

describe("PeriodTooSmallError", () => {
  it("should create error with correct message", () => {
    const error = new PeriodTooSmallError(1);
    expect(error.message).toBe("Period must be at least 1 second(s)");
    expect(error.name).toBe("PeriodTooSmallError");
    expect(error).toBeInstanceOf(PeriodError);
  });
});

describe("PeriodTooLargeError", () => {
  it("should create error with correct message", () => {
    const error = new PeriodTooLargeError(3600);
    expect(error.message).toBe("Period must not exceed 3600 seconds");
    expect(error.name).toBe("PeriodTooLargeError");
    expect(error).toBeInstanceOf(PeriodError);
  });
});

describe("DigitsError", () => {
  it("should create digits error with message", () => {
    const error = new DigitsError("Invalid digits");
    expect(error.message).toBe("Invalid digits");
    expect(error.name).toBe("DigitsError");
    expect(error).toBeInstanceOf(OTPError);
  });
});

describe("AlgorithmError", () => {
  it("should create algorithm error with message", () => {
    const error = new AlgorithmError("Invalid algorithm");
    expect(error.message).toBe("Invalid algorithm");
    expect(error.name).toBe("AlgorithmError");
    expect(error).toBeInstanceOf(OTPError);
  });
});

describe("TokenError", () => {
  it("should create token error with message", () => {
    const error = new TokenError("Invalid token");
    expect(error.message).toBe("Invalid token");
    expect(error.name).toBe("TokenError");
    expect(error).toBeInstanceOf(OTPError);
  });
});

describe("TokenLengthError", () => {
  it("should create error with correct message", () => {
    const error = new TokenLengthError(6, 8);
    expect(error.message).toBe("Token must be 6 digits, got 8");
    expect(error.name).toBe("TokenLengthError");
    expect(error).toBeInstanceOf(TokenError);
  });
});

describe("TokenFormatError", () => {
  it("should create error with default message", () => {
    const error = new TokenFormatError();
    expect(error.message).toBe("Token must contain only digits");
    expect(error.name).toBe("TokenFormatError");
    expect(error).toBeInstanceOf(TokenError);
  });
});

describe("CryptoError", () => {
  it("should create crypto error with message", () => {
    const error = new CryptoError("Crypto failed");
    expect(error.message).toBe("Crypto failed");
    expect(error.name).toBe("CryptoError");
    expect(error).toBeInstanceOf(OTPError);
  });
});

describe("HMACError", () => {
  it("should create error with prefixed message", () => {
    const error = new HMACError("Key too short");
    expect(error.message).toBe("HMAC computation failed: Key too short");
    expect(error.name).toBe("HMACError");
    expect(error).toBeInstanceOf(CryptoError);
  });
});

describe("RandomBytesError", () => {
  it("should create error with prefixed message", () => {
    const error = new RandomBytesError("Entropy low");
    expect(error.message).toBe("Random byte generation failed: Entropy low");
    expect(error.name).toBe("RandomBytesError");
    expect(error).toBeInstanceOf(CryptoError);
  });
});

describe("CounterToleranceError", () => {
  it("should create error with message", () => {
    const error = new CounterToleranceError("Invalid counter tolerance");
    expect(error.message).toBe("Invalid counter tolerance");
    expect(error.name).toBe("CounterToleranceError");
    expect(error).toBeInstanceOf(OTPError);
  });
});

describe("CounterToleranceTooLargeError", () => {
  it("should create error with max tolerance and actual value", () => {
    const error = new CounterToleranceTooLargeError(100, 150);
    expect(error.message).toBe(
      "Counter tolerance size must not exceed 100, got 150. Large tolerances can cause performance issues.",
    );
    expect(error.name).toBe("CounterToleranceTooLargeError");
    expect(error).toBeInstanceOf(CounterToleranceError);
  });
});

describe("EpochToleranceError", () => {
  it("should create error with message", () => {
    const error = new EpochToleranceError("Invalid epoch tolerance");
    expect(error.message).toBe("Invalid epoch tolerance");
    expect(error.name).toBe("EpochToleranceError");
    expect(error).toBeInstanceOf(OTPError);
  });
});

describe("EpochToleranceNegativeError", () => {
  it("should create error with default message", () => {
    const error = new EpochToleranceNegativeError();
    expect(error.message).toBe("Epoch tolerance cannot contain negative values");
    expect(error.name).toBe("EpochToleranceNegativeError");
    expect(error).toBeInstanceOf(EpochToleranceError);
  });
});

describe("EpochToleranceTooLargeError", () => {
  it("should create error with max tolerance and actual value", () => {
    const error = new EpochToleranceTooLargeError(3000, 5000);
    expect(error.message).toBe(
      "Epoch tolerance must not exceed 3000 seconds, got 5000. Large tolerances can cause performance issues.",
    );
    expect(error.name).toBe("EpochToleranceTooLargeError");
    expect(error).toBeInstanceOf(EpochToleranceError);
  });
});

describe("PluginError", () => {
  it("should create error with message", () => {
    const error = new PluginError("Plugin failed");
    expect(error.message).toBe("Plugin failed");
    expect(error.name).toBe("PluginError");
    expect(error).toBeInstanceOf(OTPError);
  });
});

describe("CryptoPluginMissingError", () => {
  it("should create error with helpful message", () => {
    const error = new CryptoPluginMissingError();
    expect(error.message).toBe("Crypto plugin is required.");
    expect(error.name).toBe("CryptoPluginMissingError");
    expect(error).toBeInstanceOf(PluginError);
  });
});

describe("Base32PluginMissingError", () => {
  it("should create error with helpful message", () => {
    const error = new Base32PluginMissingError();
    expect(error.message).toBe("Base32 plugin is required.");
    expect(error.name).toBe("Base32PluginMissingError");
    expect(error).toBeInstanceOf(PluginError);
  });
});

describe("ConfigurationError", () => {
  it("should create error with message", () => {
    const error = new ConfigurationError("Invalid config");
    expect(error.message).toBe("Invalid config");
    expect(error.name).toBe("ConfigurationError");
    expect(error).toBeInstanceOf(OTPError);
  });
});

describe("SecretMissingError", () => {
  it("should create error with helpful message", () => {
    const error = new SecretMissingError();
    expect(error.message).toContain("Secret is required");
    expect(error.message).toContain("generateSecret()");
    expect(error.name).toBe("SecretMissingError");
    expect(error).toBeInstanceOf(ConfigurationError);
  });
});

describe("LabelMissingError", () => {
  it("should create error with helpful message", () => {
    const error = new LabelMissingError();
    expect(error.message).toContain("Label is required for URI generation");
    expect(error.message).toContain("label:");
    expect(error.name).toBe("LabelMissingError");
    expect(error).toBeInstanceOf(ConfigurationError);
  });
});

describe("IssuerMissingError", () => {
  it("should create error with helpful message", () => {
    const error = new IssuerMissingError();
    expect(error.message).toContain("Issuer is required for URI generation");
    expect(error.message).toContain("issuer:");
    expect(error.name).toBe("IssuerMissingError");
    expect(error).toBeInstanceOf(ConfigurationError);
  });
});

describe("SecretTypeError", () => {
  it("should create error with helpful message", () => {
    const error = new SecretTypeError();
    expect(error.message).toContain("Class API requires secret to be a Base32 string");
    expect(error.message).toContain("not Uint8Array");
    expect(error.name).toBe("SecretTypeError");
    expect(error).toBeInstanceOf(ConfigurationError);
  });
});

describe("Base32Error", () => {
  it("should create base32 error with message", () => {
    const error = new Base32Error("Base32 operation failed");
    expect(error.message).toBe("Base32 operation failed");
    expect(error.name).toBe("Base32Error");
    expect(error).toBeInstanceOf(OTPError);
  });

  it("should support cause option", () => {
    const originalError = new Error("Original error");
    const error = new Base32Error("Wrapped error", { cause: originalError });
    expect(error.message).toBe("Wrapped error");
    expect(error.cause).toBe(originalError);
  });
});

describe("Base32EncodeError", () => {
  it("should create error with prefixed message", () => {
    const error = new Base32EncodeError("Invalid input");
    expect(error.message).toBe("Base32 encoding failed: Invalid input");
    expect(error.name).toBe("Base32EncodeError");
    expect(error).toBeInstanceOf(Base32Error);
    expect(error).toBeInstanceOf(OTPError);
  });

  it("should support cause option for error chaining", () => {
    const originalError = new TypeError("Cannot process null");
    const error = new Base32EncodeError("Input validation failed", { cause: originalError });
    expect(error.cause).toBe(originalError);
    expect(error.cause).toBeInstanceOf(TypeError);
  });
});

describe("Base32DecodeError", () => {
  it("should create error with prefixed message", () => {
    const error = new Base32DecodeError("Invalid characters");
    expect(error.message).toBe("Base32 decoding failed: Invalid characters");
    expect(error.name).toBe("Base32DecodeError");
    expect(error).toBeInstanceOf(Base32Error);
    expect(error).toBeInstanceOf(OTPError);
  });

  it("should support cause option for error chaining", () => {
    const originalError = new Error("Padding error");
    const error = new Base32DecodeError("Decode failed", { cause: originalError });
    expect(error.cause).toBe(originalError);
  });
});

describe("Error cause chaining", () => {
  it("should support cause in OTPError", () => {
    const originalError = new Error("Root cause");
    const error = new OTPError("Wrapped", { cause: originalError });
    expect(error.cause).toBe(originalError);
  });

  it("should support cause in CryptoError", () => {
    const originalError = new Error("Crypto failure");
    const error = new CryptoError("Operation failed", { cause: originalError });
    expect(error.cause).toBe(originalError);
  });

  it("should support cause in HMACError", () => {
    const originalError = new Error("Key import failed");
    const error = new HMACError("HMAC failed", { cause: originalError });
    expect(error.cause).toBe(originalError);
    expect(error.message).toBe("HMAC computation failed: HMAC failed");
  });

  it("should support cause in RandomBytesError", () => {
    const originalError = new Error("Entropy exhausted");
    const error = new RandomBytesError("Generation failed", { cause: originalError });
    expect(error.cause).toBe(originalError);
    expect(error.message).toBe("Random byte generation failed: Generation failed");
  });

  it("should allow accessing cause for debugging", () => {
    const level1 = new Error("Database connection failed");
    const level2 = new CryptoError("Key retrieval failed", { cause: level1 });
    const level3 = new HMACError("HMAC operation failed", { cause: level2 });

    expect(level3.cause).toBe(level2);
    expect((level3.cause as Error).cause).toBe(level1);
  });
});
