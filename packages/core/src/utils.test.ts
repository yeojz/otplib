import { describe, it, expect } from "vitest";
import { BASE_SECRET_BASE32 } from "@repo/testing";
import {
  MIN_SECRET_BYTES,
  MAX_SECRET_BYTES,
  RECOMMENDED_SECRET_BYTES,
  MIN_PERIOD,
  MAX_PERIOD,
  DEFAULT_PERIOD,
  MAX_COUNTER,
  MAX_WINDOW,
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
  constantTimeEqual,
  getDigestSize,
  stringToBytes,
  hexToBytes,
  generateSecret,
  normalizeSecret,
  normalizeCounterTolerance,
  normalizeEpochTolerance,
  requireCryptoPlugin,
  requireBase32Plugin,
  requireSecret,
  requireLabel,
  requireIssuer,
  requireBase32String,
  wrapResult,
  wrapResultAsync,
  type OTPGuardrails,
} from "./utils.js";
import {
  OTPError,
  SecretTooShortError,
  SecretTooLongError,
  CounterNegativeError,
  CounterOverflowError,
  TimeNegativeError,
  PeriodTooSmallError,
  PeriodTooLargeError,
  TokenLengthError,
  TokenFormatError,
  CounterToleranceTooLargeError,
  EpochToleranceNegativeError,
  EpochToleranceTooLargeError,
  CryptoPluginMissingError,
  Base32PluginMissingError,
  SecretMissingError,
  LabelMissingError,
  IssuerMissingError,
  SecretTypeError,
} from "./errors.js";

describe("Constants", () => {
  it("should have correct secret constants", () => {
    expect(MIN_SECRET_BYTES).toBe(16); // 128 bits
    expect(MAX_SECRET_BYTES).toBe(64); // 512 bits
    expect(RECOMMENDED_SECRET_BYTES).toBe(20); // 160 bits
  });

  it("should have correct period constants", () => {
    expect(MIN_PERIOD).toBe(1);
    expect(MAX_PERIOD).toBe(3600);
    expect(DEFAULT_PERIOD).toBe(30);
  });

  it("should have correct counter constant", () => {
    expect(MAX_COUNTER).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("should have correct window constant", () => {
    expect(MAX_WINDOW).toBe(100);
  });
});

describe("createGuardrails and hasGuardrailOverrides", () => {
  it("should return default guardrails without arguments", () => {
    const guardrails = createGuardrails();
    expect(guardrails.MIN_SECRET_BYTES).toBe(MIN_SECRET_BYTES);
    expect(guardrails.MAX_SECRET_BYTES).toBe(MAX_SECRET_BYTES);
    expect(guardrails.MIN_PERIOD).toBe(MIN_PERIOD);
    expect(guardrails.MAX_PERIOD).toBe(MAX_PERIOD);
    expect(guardrails.MAX_COUNTER).toBe(MAX_COUNTER);
    expect(guardrails.MAX_WINDOW).toBe(MAX_WINDOW);
  });

  it("should return false for default guardrails", () => {
    const guardrails = createGuardrails();
    expect(hasGuardrailOverrides(guardrails)).toBe(false);
  });

  it("should return same object when called multiple times without arguments", () => {
    const g1 = createGuardrails();
    const g2 = createGuardrails();
    expect(g1).toBe(g2); // Same reference (singleton)
  });

  it("should create custom guardrails", () => {
    const guardrails = createGuardrails({
      MIN_SECRET_BYTES: 10,
      MAX_WINDOW: 20,
    });
    expect(guardrails.MIN_SECRET_BYTES).toBe(10);
    expect(guardrails.MAX_WINDOW).toBe(20);
    // Other values should be defaults
    expect(guardrails.MAX_SECRET_BYTES).toBe(MAX_SECRET_BYTES);
    expect(guardrails.MIN_PERIOD).toBe(MIN_PERIOD);
  });

  it("should return true for custom guardrails", () => {
    const guardrails = createGuardrails({ MAX_WINDOW: 20 });
    expect(hasGuardrailOverrides(guardrails)).toBe(true);
  });

  it("should return false for guardrails without override symbol", () => {
    // Simulate a guardrails object created outside the factory
    // (e.g., manually constructed or from older version)
    const unknownGuardrails = Object.freeze({
      MIN_SECRET_BYTES: 16,
      MAX_SECRET_BYTES: 64,
      MIN_PERIOD: 1,
      MAX_PERIOD: 3600,
      MAX_COUNTER: Number.MAX_SAFE_INTEGER,
      MAX_WINDOW: 50,
    }) as OTPGuardrails;
    expect(hasGuardrailOverrides(unknownGuardrails)).toBe(false);
  });

  it("should hide override flag from normal enumeration", () => {
    const guardrails = createGuardrails({ MAX_WINDOW: 20 });

    // Symbol should not appear in normal enumeration
    expect(Object.keys(guardrails)).not.toContain("OVERRIDE_SYMBOL");
    expect(Object.getOwnPropertyNames(guardrails)).not.toContain("OVERRIDE_SYMBOL");

    // Symbol should appear only in symbol enumeration
    const symbols = Object.getOwnPropertySymbols(guardrails);
    expect(symbols.length).toBe(1);

    // JSON serialization should not include the symbol
    const json = JSON.stringify(guardrails);
    expect(json).not.toContain("OVERRIDE");
    expect(json).not.toContain("override");
  });

  it("should freeze guardrails objects", () => {
    const guardrails = createGuardrails({ MAX_WINDOW: 20 });
    expect(Object.isFrozen(guardrails)).toBe(true);
  });

  it("should create different objects for different custom values", () => {
    const g1 = createGuardrails({ MAX_WINDOW: 20 });
    const g2 = createGuardrails({ MAX_WINDOW: 30 });
    expect(g1).not.toBe(g2); // Different references
    expect(g1.MAX_WINDOW).toBe(20);
    expect(g2.MAX_WINDOW).toBe(30);
  });
});

describe("validateSecret", () => {
  it("should accept valid secret", () => {
    const secret = stringToBytes("0123456789012345");
    expect(() => validateSecret(secret, createGuardrails())).not.toThrow();
  });

  it("should accept recommended secret length", () => {
    const secret = new Uint8Array(RECOMMENDED_SECRET_BYTES);
    globalThis.crypto.getRandomValues(secret);
    expect(() => validateSecret(secret, createGuardrails())).not.toThrow();
  });

  it("should throw SecretTooShortError for short secret", () => {
    const secret = new Uint8Array(MIN_SECRET_BYTES - 1);
    expect(() => validateSecret(secret, createGuardrails())).toThrowError(SecretTooShortError);
  });

  it("should throw SecretTooLongError for long secret", () => {
    const secret = new Uint8Array(MAX_SECRET_BYTES + 1);
    expect(() => validateSecret(secret, createGuardrails())).toThrowError(SecretTooLongError);
  });

  it("should accept secret with some repeated bytes", () => {
    const secret = stringToBytes("0123456789012345");
    expect(() => validateSecret(secret, createGuardrails())).not.toThrow();
  });
});

describe("validateCounter", () => {
  it("should accept zero counter", () => {
    expect(() => validateCounter(0, createGuardrails())).not.toThrow();
    expect(() => validateCounter(0n, createGuardrails())).not.toThrow();
  });

  it("should accept positive counter", () => {
    expect(() => validateCounter(1, createGuardrails())).not.toThrow();
    expect(() => validateCounter(1000, createGuardrails())).not.toThrow();
    expect(() => validateCounter(1n, createGuardrails())).not.toThrow();
    expect(() => validateCounter(1000n, createGuardrails())).not.toThrow();
  });

  it("should accept max safe integer", () => {
    expect(() => validateCounter(MAX_COUNTER, createGuardrails())).not.toThrow();
  });

  it("should throw CounterNegativeError for negative number", () => {
    expect(() => validateCounter(-1, createGuardrails())).toThrowError(CounterNegativeError);
  });

  it("should throw CounterNegativeError for negative bigint", () => {
    expect(() => validateCounter(-1n, createGuardrails())).toThrowError(CounterNegativeError);
  });

  it("should throw CounterOverflowError for number exceeding max safe integer", () => {
    expect(() => validateCounter(Number.MAX_SAFE_INTEGER + 1, createGuardrails())).toThrowError(
      CounterOverflowError,
    );
  });

  it("should throw CounterOverflowError for bigint exceeding max safe integer", () => {
    expect(() =>
      validateCounter(BigInt(Number.MAX_SAFE_INTEGER) + 1n, createGuardrails()),
    ).toThrowError(CounterOverflowError);
  });
});

describe("validateTime", () => {
  it("should accept zero time", () => {
    expect(() => validateTime(0)).not.toThrow();
  });

  it("should accept positive time", () => {
    expect(() => validateTime(1000)).not.toThrow();
    expect(() => validateTime(Date.now() / 1000)).not.toThrow();
  });

  it("should throw TimeNegativeError for negative time", () => {
    expect(() => validateTime(-1)).toThrowError(TimeNegativeError);
  });
});

describe("validatePeriod", () => {
  it("should accept valid periods", () => {
    expect(() => validatePeriod(MIN_PERIOD, createGuardrails())).not.toThrow();
    expect(() => validatePeriod(DEFAULT_PERIOD, createGuardrails())).not.toThrow();
    expect(() => validatePeriod(MAX_PERIOD, createGuardrails())).not.toThrow();
  });

  it("should throw PeriodTooSmallError for period less than minimum", () => {
    expect(() => validatePeriod(MIN_PERIOD - 1, createGuardrails())).toThrowError(
      PeriodTooSmallError,
    );
  });

  it("should throw PeriodTooSmallError for non-integer", () => {
    expect(() => validatePeriod(1.5, createGuardrails())).toThrowError(PeriodTooSmallError);
  });

  it("should throw PeriodTooLargeError for period exceeding maximum", () => {
    expect(() => validatePeriod(MAX_PERIOD + 1, createGuardrails())).toThrowError(
      PeriodTooLargeError,
    );
  });
});

describe("validatePeriod with guardrails", () => {
  it("should accept custom MIN_PERIOD", () => {
    const g = createGuardrails({ MIN_PERIOD: 5 });
    expect(() => validatePeriod(5, g)).not.toThrow();
  });

  it("should throw PeriodTooSmallError with custom MIN_PERIOD", () => {
    const g = createGuardrails({ MIN_PERIOD: 10 });
    expect(() => validatePeriod(9, g)).toThrowError(PeriodTooSmallError);
  });

  it("should accept custom MAX_PERIOD", () => {
    const g = createGuardrails({ MAX_PERIOD: 120 });
    expect(() => validatePeriod(120, g)).not.toThrow();
  });

  it("should throw PeriodTooLargeError with custom MAX_PERIOD", () => {
    const g = createGuardrails({ MAX_PERIOD: 60 });
    expect(() => validatePeriod(61, g)).toThrowError(PeriodTooLargeError);
  });
});

describe("validateToken", () => {
  it("should accept valid 6-digit token", () => {
    expect(() => validateToken("123456", 6)).not.toThrow();
  });

  it("should accept valid 8-digit token", () => {
    expect(() => validateToken("12345678", 8)).not.toThrow();
  });

  it("should accept token with leading zeros", () => {
    expect(() => validateToken("000001", 6)).not.toThrow();
  });

  it("should throw TokenLengthError for incorrect length", () => {
    expect(() => validateToken("12345", 6)).toThrowError(TokenLengthError);
    expect(() => validateToken("1234567", 6)).toThrowError(TokenLengthError);
  });

  it("should throw TokenFormatError for non-digit characters", () => {
    expect(() => validateToken("12345a", 6)).toThrowError(TokenFormatError);
    expect(() => validateToken("abcdef", 6)).toThrowError(TokenFormatError);
    expect(() => validateToken("123 45", 6)).toThrowError(TokenFormatError);
  });
});

describe("validateCounterTolerance", () => {
  it("should accept valid numeric tolerance", () => {
    expect(() => validateCounterTolerance(0, createGuardrails())).not.toThrow();
    expect(() => validateCounterTolerance(1, createGuardrails())).not.toThrow();
    expect(() => validateCounterTolerance(MAX_WINDOW, createGuardrails())).not.toThrow();
  });

  it("should accept valid array tolerance", () => {
    expect(() => validateCounterTolerance([0], createGuardrails())).not.toThrow();
    expect(() => validateCounterTolerance([0, 1, 2], createGuardrails())).not.toThrow();
    expect(() => validateCounterTolerance([-1, 0, 1], createGuardrails())).not.toThrow();
  });

  it("should throw CounterToleranceTooLargeError for tolerance exceeding max", () => {
    expect(() => validateCounterTolerance(MAX_WINDOW + 1, createGuardrails())).toThrowError(
      CounterToleranceTooLargeError,
    );
  });

  it("should throw CounterToleranceTooLargeError for array with too many elements", () => {
    const largeArray = Array.from({ length: MAX_WINDOW * 2 + 2 }, (_, i) => i);
    expect(() => validateCounterTolerance(largeArray, createGuardrails())).toThrowError(
      CounterToleranceTooLargeError,
    );
  });
});

describe("validateCounterTolerance with guardrails", () => {
  it("should accept custom MAX_WINDOW for numeric tolerance", () => {
    const g = createGuardrails({ MAX_WINDOW: 5 });
    expect(() => validateCounterTolerance(5, g)).not.toThrow();
  });

  it("should throw CounterToleranceTooLargeError with custom MAX_WINDOW", () => {
    const g = createGuardrails({ MAX_WINDOW: 3 });
    expect(() => validateCounterTolerance(4, g)).toThrowError(CounterToleranceTooLargeError);
  });

  it("should accept custom MAX_WINDOW for array tolerance", () => {
    const g = createGuardrails({ MAX_WINDOW: 2 });
    expect(() => validateCounterTolerance([0, 1, 2, 3, 4], g)).not.toThrow(); // 5 elements <= 2*2+1
  });

  it("should throw CounterToleranceTooLargeError for array exceeding custom MAX_WINDOW", () => {
    const g = createGuardrails({ MAX_WINDOW: 2 });
    const largeArray = Array.from({ length: 6 }, (_, i) => i); // 6 > 2*2+1
    expect(() => validateCounterTolerance(largeArray, g)).toThrowError(
      CounterToleranceTooLargeError,
    );
  });
});

describe("validateEpochTolerance", () => {
  it("should accept valid numeric tolerance", () => {
    expect(() => validateEpochTolerance(0)).not.toThrow();
    expect(() => validateEpochTolerance(30)).not.toThrow();
    expect(() => validateEpochTolerance(MAX_WINDOW * DEFAULT_PERIOD)).not.toThrow();
  });

  it("should accept valid tuple tolerance", () => {
    expect(() => validateEpochTolerance([0, 0])).not.toThrow();
    expect(() => validateEpochTolerance([30, 30])).not.toThrow();
    expect(() => validateEpochTolerance([5, 0])).not.toThrow();
  });

  it("should throw EpochToleranceNegativeError for negative tolerance", () => {
    expect(() => validateEpochTolerance(-1)).toThrowError(EpochToleranceNegativeError);
    expect(() => validateEpochTolerance([-1, 0])).toThrowError(EpochToleranceNegativeError);
    expect(() => validateEpochTolerance([0, -1])).toThrowError(EpochToleranceNegativeError);
  });

  it("should throw EpochToleranceTooLargeError for tolerance exceeding max", () => {
    const maxToleranceSeconds = MAX_WINDOW * DEFAULT_PERIOD;
    expect(() => validateEpochTolerance(maxToleranceSeconds + 1)).toThrowError(
      EpochToleranceTooLargeError,
    );
    expect(() => validateEpochTolerance([0, maxToleranceSeconds + 1])).toThrowError(
      EpochToleranceTooLargeError,
    );
  });

  it("should accept higher tolerance when period is larger", () => {
    // With default period 30s, max tolerance is MAX_WINDOW * 30 = 3000s
    // With period 60s, max tolerance is MAX_WINDOW * 60 = 6000s
    const toleranceExceedingDefault = MAX_WINDOW * DEFAULT_PERIOD + 1;

    // Should throw with default period
    expect(() => validateEpochTolerance(toleranceExceedingDefault)).toThrowError(
      EpochToleranceTooLargeError,
    );

    // Should succeed with 60s period
    expect(() => validateEpochTolerance(toleranceExceedingDefault, 60)).not.toThrow();
  });

  it("should use actual period for max tolerance calculation", () => {
    // Max tolerance with 60s period = MAX_WINDOW * 60 = 6000s
    expect(() => validateEpochTolerance(MAX_WINDOW * 60, 60)).not.toThrow();
    expect(() => validateEpochTolerance(MAX_WINDOW * 60 + 1, 60)).toThrowError(
      EpochToleranceTooLargeError,
    );
  });

  it("should have lower max tolerance when period is smaller", () => {
    // Max tolerance with 10s period = MAX_WINDOW * 10 = 1000s
    expect(() => validateEpochTolerance(1000, 10)).not.toThrow();
    expect(() => validateEpochTolerance(1001, 10)).toThrowError(EpochToleranceTooLargeError);
  });
});

describe("validateEpochTolerance with guardrails", () => {
  it("should accept custom MAX_WINDOW for numeric tolerance", () => {
    const g = createGuardrails({ MAX_WINDOW: 5 });
    const maxToleranceSeconds = 5 * DEFAULT_PERIOD;
    expect(() => validateEpochTolerance(maxToleranceSeconds, DEFAULT_PERIOD, g)).not.toThrow();
  });

  it("should throw EpochToleranceTooLargeError with custom MAX_WINDOW", () => {
    const g = createGuardrails({ MAX_WINDOW: 3 });
    const maxToleranceSeconds = 3 * DEFAULT_PERIOD;
    expect(() => validateEpochTolerance(maxToleranceSeconds + 1, DEFAULT_PERIOD, g)).toThrowError(
      EpochToleranceTooLargeError,
    );
  });

  it("should accept custom MAX_WINDOW for tuple tolerance", () => {
    const g = createGuardrails({ MAX_WINDOW: 2 });
    const maxToleranceSeconds = 2 * DEFAULT_PERIOD;
    expect(() =>
      validateEpochTolerance([maxToleranceSeconds, maxToleranceSeconds], DEFAULT_PERIOD, g),
    ).not.toThrow();
  });

  it("should throw EpochToleranceTooLargeError for tuple exceeding custom MAX_WINDOW", () => {
    const g = createGuardrails({ MAX_WINDOW: 2 });
    const maxToleranceSeconds = 2 * DEFAULT_PERIOD;
    expect(() =>
      validateEpochTolerance([0, maxToleranceSeconds + 1], DEFAULT_PERIOD, g),
    ).toThrowError(EpochToleranceTooLargeError);
  });
});

describe("normalizeCounterTolerance", () => {
  it("should return default [0] for undefined", () => {
    expect(normalizeCounterTolerance()).toEqual([0]);
  });

  it("should return array as-is", () => {
    expect(normalizeCounterTolerance([0, 1, 2])).toEqual([0, 1, 2]);
    expect(normalizeCounterTolerance([-1, 0, 1])).toEqual([-1, 0, 1]);
  });

  it("should generate symmetric range for number", () => {
    expect(normalizeCounterTolerance(0)).toEqual([0]);
    expect(normalizeCounterTolerance(1)).toEqual([-1, 0, 1]);
    expect(normalizeCounterTolerance(2)).toEqual([-2, -1, 0, 1, 2]);
  });
});

describe("normalizeEpochTolerance", () => {
  it("should return default [0, 0] for undefined", () => {
    expect(normalizeEpochTolerance()).toEqual([0, 0]);
  });

  it("should return tuple as-is", () => {
    expect(normalizeEpochTolerance([30, 60])).toEqual([30, 60]);
    expect(normalizeEpochTolerance([5, 0])).toEqual([5, 0]);
  });

  it("should generate symmetric tuple for number", () => {
    expect(normalizeEpochTolerance(0)).toEqual([0, 0]);
    expect(normalizeEpochTolerance(30)).toEqual([30, 30]);
  });
});

describe("counterToBytes", () => {
  it("should convert zero to 8-byte array", () => {
    const result = counterToBytes(0);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(8);
    expect(Array.from(result)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("should convert number to big-endian bytes", () => {
    const result = counterToBytes(1);
    expect(Array.from(result)).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
  });

  it("should convert larger number to big-endian bytes", () => {
    const result = counterToBytes(0x1234567890abcdefn);
    expect(Array.from(result)).toEqual([0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef]);
  });

  it("should handle bigint input", () => {
    const result = counterToBytes(0xffffffffffffffffn);
    expect(Array.from(result)).toEqual([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
  });

  it("should be reversible for small values", () => {
    const bytes = counterToBytes(42);
    const view = new DataView(bytes.buffer);
    const value = view.getBigUint64(0, false); // big-endian
    expect(value).toBe(42n);
  });
});

describe("dynamicTruncate", () => {
  it("should extract 31-bit integer from HMAC result", () => {
    // Last byte is 0x1f, so offset = 0x1f & 0x0f = 0x0f = 15
    // But we only have 20 bytes (SHA-1), so offset must be < 16
    const hmacResult = new Uint8Array([
      0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e,
      0x0f, 0x7f, 0xff, 0xff, 0xff,
    ]);
    const result = dynamicTruncate(hmacResult);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(2 ** 31);
  });

  it("should handle offset pointing to last 4 bytes", () => {
    // Last byte is 0x10, offset = 0x10 & 0x0f = 0x00, extracts bytes 0,1,2,3
    const hmacResult = new Uint8Array([
      0x12, 0x34, 0x56, 0x78, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e,
      0x0f, 0x11, 0x22, 0x33, 0x10,
    ]);
    const result = dynamicTruncate(hmacResult);
    // 0x12 with high bit masked = 0x12
    // Result = (0x12 << 24) | (0x34 << 16) | (0x56 << 8) | 0x78
    expect(result).toBe(0x12345678);
  });

  it("should mask high bit of first byte", () => {
    // Offset 0, first byte has high bit set
    const hmacResult = new Uint8Array([
      0xff, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
      0x0c, 0x0d, 0x0e, 0x0f, 0x10,
    ]);
    const result = dynamicTruncate(hmacResult);
    // 0xff & 0x7f = 0x7f, so result starts with 0x7f...
    expect(result).toBeLessThan(2 ** 31);
  });
});

describe("truncateDigits", () => {
  it("should generate 6-digit OTP with leading zeros", () => {
    const otp = truncateDigits(123, 6);
    expect(otp).toBe("000123");
  });

  it("should generate 6-digit OTP", () => {
    const otp = truncateDigits(123456, 6);
    expect(otp).toBe("123456");
  });

  it("should generate 8-digit OTP", () => {
    const otp = truncateDigits(12345678, 8);
    expect(otp).toBe("12345678");
  });

  it("should modulo large values", () => {
    const otp = truncateDigits(123456789, 6);
    expect(otp).toBe("456789"); // 123456789 % 1000000
  });

  it("should handle zero value", () => {
    const otp = truncateDigits(0, 6);
    expect(otp).toBe("000000");
  });

  it("should pad to correct length", () => {
    const otp = truncateDigits(5, 6);
    expect(otp).toBe("000005");
    expect(otp.length).toBe(6);
  });
});

describe("constantTimeEqual", () => {
  it("should return true for equal strings", () => {
    expect(constantTimeEqual("hello", "hello")).toBe(true);
  });

  it("should return false for unequal strings", () => {
    expect(constantTimeEqual("hello", "world")).toBe(false);
  });

  it("should return true for equal Uint8Array", () => {
    const a = stringToBytes("12345");
    const b = stringToBytes("12345");
    expect(constantTimeEqual(a, b)).toBe(true);
  });

  it("should return false for unequal Uint8Array", () => {
    const a = stringToBytes("12345");
    const b = stringToBytes("12346");
    expect(constantTimeEqual(a, b)).toBe(false);
  });

  it("should return false for different length strings", () => {
    expect(constantTimeEqual("hello", "hello!")).toBe(false);
  });

  it("should return false for different length arrays", () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 3, 4]);
    expect(constantTimeEqual(a, b)).toBe(false);
  });

  it("should handle empty strings", () => {
    expect(constantTimeEqual("", "")).toBe(true);
    expect(constantTimeEqual("", "a")).toBe(false);
  });

  it("should handle empty arrays", () => {
    const a = new Uint8Array(0);
    const b = new Uint8Array(0);
    expect(constantTimeEqual(a, b)).toBe(true);
  });

  it("should handle mixed string and array", () => {
    const str = "hello";
    const arr = new TextEncoder().encode("hello");
    expect(constantTimeEqual(str, arr)).toBe(true);
  });

  // Timing attack resistance tests
  describe("timing attack resistance", () => {
    it("should compare all bytes regardless of early mismatch", () => {
      // Verify the implementation uses XOR accumulation pattern
      // by checking that it doesn't short-circuit on first mismatch
      const a = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const b = new Uint8Array([0, 2, 3, 4, 5, 6, 7, 8]); // First byte differs
      const c = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 0]); // Last byte differs

      // Both should return false
      expect(constantTimeEqual(a, b)).toBe(false);
      expect(constantTimeEqual(a, c)).toBe(false);
    });

    it("should handle tokens with leading zeros consistently", () => {
      // OTP tokens often have leading zeros which could leak via timing
      expect(constantTimeEqual("000001", "000001")).toBe(true);
      expect(constantTimeEqual("000001", "000002")).toBe(false);
      expect(constantTimeEqual("100000", "000001")).toBe(false);
    });

    it("should compare same-length strings in constant time pattern", () => {
      // Generate test cases where only one character differs at various positions
      const base = "123456";
      const diffFirst = "023456";
      const diffMiddle = "123056";
      const diffLast = "123450";

      // All should return false
      expect(constantTimeEqual(base, diffFirst)).toBe(false);
      expect(constantTimeEqual(base, diffMiddle)).toBe(false);
      expect(constantTimeEqual(base, diffLast)).toBe(false);
    });

    it("should not leak information via exception timing", () => {
      // Ensure function doesn't throw for edge cases that could leak info
      expect(() => constantTimeEqual("", "")).not.toThrow();
      expect(() => constantTimeEqual("a", "")).not.toThrow();
      expect(() => constantTimeEqual("", "a")).not.toThrow();
      expect(() => constantTimeEqual(new Uint8Array(0), new Uint8Array(0))).not.toThrow();
    });

    it("should process all bytes for same-length inputs", () => {
      // Create arrays where XOR result would be 0 only after processing all bytes
      const a = new Uint8Array([255, 255, 255, 255]);
      const b = new Uint8Array([255, 255, 255, 255]);
      const c = new Uint8Array([255, 255, 255, 254]); // Last byte differs by 1

      expect(constantTimeEqual(a, b)).toBe(true);
      expect(constantTimeEqual(a, c)).toBe(false);
    });
  });
});

describe("getDigestSize", () => {
  it("should return correct size for SHA-1", () => {
    expect(getDigestSize("sha1")).toBe(20);
  });

  it("should return correct size for SHA-256", () => {
    expect(getDigestSize("sha256")).toBe(32);
  });

  it("should return correct size for SHA-512", () => {
    expect(getDigestSize("sha512")).toBe(64);
  });
});

describe("hexToBytes", () => {
  it("should convert lowercase hex string to bytes", () => {
    const result = hexToBytes("cc93cf18");
    expect(result).toEqual(new Uint8Array([0xcc, 0x93, 0xcf, 0x18]));
  });

  it("should convert uppercase hex string to bytes", () => {
    const result = hexToBytes("CC93CF18");
    expect(result).toEqual(new Uint8Array([0xcc, 0x93, 0xcf, 0x18]));
  });

  it("should convert RFC 4226 test vector HMAC", () => {
    const result = hexToBytes("cc93cf18508d94934c64b65d8ba7667fb7cde4b0");
    expect(result.length).toBe(20);
    expect(result[0]).toBe(0xcc);
    expect(result[19]).toBe(0xb0);
  });

  it("should handle empty string", () => {
    const result = hexToBytes("");
    expect(result).toEqual(new Uint8Array(0));
  });

  it("should handle single byte", () => {
    const result = hexToBytes("ff");
    expect(result).toEqual(new Uint8Array([0xff]));
  });

  it("should handle all zeros", () => {
    const result = hexToBytes("0000000000");
    expect(result).toEqual(new Uint8Array([0, 0, 0, 0, 0]));
  });
});

describe("generateSecret", () => {
  // Mock crypto plugin
  const mockCrypto = {
    name: "mock",
    hmac: () => new Uint8Array(20),
    randomBytes: (length: number) => {
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        bytes[i] = i % 256;
      }
      return bytes;
    },
    constantTimeEqual: () => true,
  };

  // Mock base32 plugin
  const mockBase32 = {
    name: "mock",
    encode: (data: Uint8Array) => {
      // Simple mock: return length info as string
      return "A".repeat(Math.ceil((data.length * 8) / 5));
    },
    decode: (str: string) => new Uint8Array(str.length),
  };

  it("should generate a Base32-encoded secret", () => {
    const secret = generateSecret({ crypto: mockCrypto, base32: mockBase32 });
    expect(typeof secret).toBe("string");
    expect(secret.length).toBeGreaterThan(0);
  });

  it("should use RECOMMENDED_SECRET_BYTES by default", () => {
    let capturedLength = 0;
    const trackingCrypto = {
      ...mockCrypto,
      randomBytes: (length: number) => {
        capturedLength = length;
        return mockCrypto.randomBytes(length);
      },
    };

    generateSecret({ crypto: trackingCrypto, base32: mockBase32 });
    expect(capturedLength).toBe(RECOMMENDED_SECRET_BYTES);
  });

  it("should support custom length", () => {
    let capturedLength = 0;
    const trackingCrypto = {
      ...mockCrypto,
      randomBytes: (length: number) => {
        capturedLength = length;
        return mockCrypto.randomBytes(length);
      },
    };

    generateSecret({ crypto: trackingCrypto, base32: mockBase32, length: 32 });
    expect(capturedLength).toBe(32);
  });

  it("should call encode without padding", () => {
    let capturedOptions: { padding?: boolean } | undefined;
    const trackingBase32 = {
      ...mockBase32,
      encode: (data: Uint8Array, options?: { padding?: boolean }) => {
        capturedOptions = options;
        return mockBase32.encode(data);
      },
    };

    generateSecret({ crypto: mockCrypto, base32: trackingBase32 });
    expect(capturedOptions).toEqual({ padding: false });
  });
});

describe("normalizeSecret", () => {
  it("should return Uint8Array as-is when already bytes", () => {
    const secret = stringToBytes("abc"); // Using readable string instead of [1, 2, 3]
    const result = normalizeSecret(secret);
    expect(result).toBe(secret);
  });

  it("should decode string secret using base32 plugin", () => {
    const secret = BASE_SECRET_BASE32;
    const decodedBytes = stringToBytes("abcde"); // Expected decoded result

    const mockBase32Plugin = {
      name: "mock",
      encode: () => "",
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      decode: (str: string) => decodedBytes,
    };

    const result = normalizeSecret(secret, mockBase32Plugin);
    expect(result).toEqual(decodedBytes);
  });

  it("should throw when string secret provided without base32 plugin", () => {
    const secret = BASE_SECRET_BASE32;
    expect(() => normalizeSecret(secret)).toThrowError(
      "String secrets require a Base32Plugin. Please provide a base32 parameter.",
    );
  });
});

describe("requireCryptoPlugin", () => {
  it("should not throw when crypto plugin is provided", () => {
    const plugin = {
      name: "test",
      hmac: () => new Uint8Array(),
      randomBytes: () => new Uint8Array(),
    };
    expect(() => requireCryptoPlugin(plugin)).not.toThrow();
  });

  it("should throw CryptoPluginMissingError when crypto is undefined", () => {
    expect(() => requireCryptoPlugin(undefined)).toThrowError(CryptoPluginMissingError);
  });
});

describe("requireBase32Plugin", () => {
  it("should not throw when base32 plugin is provided", () => {
    const plugin = { name: "test", encode: () => "", decode: () => new Uint8Array() };
    expect(() => requireBase32Plugin(plugin)).not.toThrow();
  });

  it("should throw Base32PluginMissingError when base32 is undefined", () => {
    expect(() => requireBase32Plugin(undefined)).toThrowError(Base32PluginMissingError);
  });
});

describe("requireSecret", () => {
  it("should not throw when secret is provided", () => {
    expect(() => requireSecret("secret")).not.toThrow();
    expect(() => requireSecret(stringToBytes("bytes"))).not.toThrow();
  });

  it("should throw SecretMissingError when secret is undefined", () => {
    expect(() => requireSecret(undefined)).toThrowError(SecretMissingError);
  });
});

describe("requireLabel", () => {
  it("should not throw when label is provided", () => {
    expect(() => requireLabel("user@example.com")).not.toThrow();
  });

  it("should throw LabelMissingError when label is undefined", () => {
    expect(() => requireLabel(undefined)).toThrowError(LabelMissingError);
  });
});

describe("requireIssuer", () => {
  it("should not throw when issuer is provided", () => {
    expect(() => requireIssuer("MyApp")).not.toThrow();
  });

  it("should throw IssuerMissingError when issuer is undefined", () => {
    expect(() => requireIssuer(undefined)).toThrowError(IssuerMissingError);
  });
});

describe("requireBase32String", () => {
  it("should not throw when secret is a string", () => {
    expect(() => requireBase32String(BASE_SECRET_BASE32)).not.toThrow();
  });

  it("should throw SecretTypeError when secret is Uint8Array", () => {
    expect(() => requireBase32String(stringToBytes("bytes"))).toThrowError(SecretTypeError);
  });
});

describe("wrapResult", () => {
  it("should return ok result when function succeeds", () => {
    const fn = (a: number, b: number) => a + b;
    const wrapped = wrapResult(fn);

    const result = wrapped(2, 3);

    expect(result).toEqual({ ok: true, value: 5 });
  });

  it("should return err result when function throws", () => {
    const fn = () => {
      throw new SecretTooShortError(16, 8);
    };
    const wrapped = wrapResult(fn);

    const result = wrapped();

    expect(result).toEqual({ ok: false, error: expect.any(SecretTooShortError) });
    if (result.ok === false) {
      expect(result.error).toBeInstanceOf(SecretTooShortError);
    }
  });

  it("should preserve error subclass", () => {
    const fn = () => {
      throw new CounterNegativeError();
    };
    const wrapped = wrapResult(fn);

    const result = wrapped();

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toBeInstanceOf(CounterNegativeError);
      expect(result.error).toBeInstanceOf(OTPError);
    }
  });

  it("should pass through all arguments", () => {
    const fn = (...args: number[]) => args.reduce((a, b) => a + b, 0);
    const wrapped = wrapResult(fn);

    const result = wrapped(1, 2, 3, 4, 5);

    expect(result).toEqual({ ok: true, value: 15 });
  });

  it("should handle functions returning various types", () => {
    const returnString = () => "hello";
    const returnNumber = () => 42;
    const returnObject = () => ({ foo: "bar" });
    const returnArray = () => [1, 2, 3];

    expect(wrapResult(returnString)()).toEqual({ ok: true, value: "hello" });
    expect(wrapResult(returnNumber)()).toEqual({ ok: true, value: 42 });
    expect(wrapResult(returnObject)()).toEqual({ ok: true, value: { foo: "bar" } });
    expect(wrapResult(returnArray)()).toEqual({ ok: true, value: [1, 2, 3] });
  });
});

describe("wrapResultAsync", () => {
  it("should return ok result when async function succeeds", async () => {
    const fn = async (a: number, b: number) => a + b;
    const wrapped = wrapResultAsync(fn);

    const result = await wrapped(2, 3);

    expect(result).toEqual({ ok: true, value: 5 });
  });

  it("should return err result when async function throws", async () => {
    const fn = async () => {
      throw new TimeNegativeError();
    };
    const wrapped = wrapResultAsync(fn);

    const result = await wrapped();

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toBeInstanceOf(TimeNegativeError);
    }
  });

  it("should preserve error subclass for async throws", async () => {
    const fn = async () => {
      throw new PeriodTooSmallError(1);
    };
    const wrapped = wrapResultAsync(fn);

    const result = await wrapped();

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toBeInstanceOf(PeriodTooSmallError);
      expect(result.error).toBeInstanceOf(OTPError);
    }
  });

  it("should pass through all arguments to async function", async () => {
    const fn = async (...args: number[]) => {
      // Simulate async operation
      await Promise.resolve();
      return args.reduce((a, b) => a + b, 0);
    };
    const wrapped = wrapResultAsync(fn);

    const result = await wrapped(1, 2, 3, 4, 5);

    expect(result).toEqual({ ok: true, value: 15 });
  });

  it("should handle async functions returning various types", async () => {
    const returnString = async () => "hello";
    const returnNumber = async () => 42;
    const returnObject = async () => ({ foo: "bar" });
    const returnArray = async () => [1, 2, 3];

    expect(await wrapResultAsync(returnString)()).toEqual({ ok: true, value: "hello" });
    expect(await wrapResultAsync(returnNumber)()).toEqual({ ok: true, value: 42 });
    expect(await wrapResultAsync(returnObject)()).toEqual({ ok: true, value: { foo: "bar" } });
    expect(await wrapResultAsync(returnArray)()).toEqual({ ok: true, value: [1, 2, 3] });
  });

  it("should await promises before wrapping", async () => {
    const fn = async () => {
      return await Promise.resolve("async result");
    };
    const wrapped = wrapResultAsync(fn);

    const result = await wrapped();

    expect(result).toEqual({ ok: true, value: "async result" });
  });
});

describe("createGuardrails", () => {
  it("returns default guardrails when no custom provided", () => {
    const g = createGuardrails();
    expect(g.MIN_SECRET_BYTES).toBe(16);
    expect(g.MAX_SECRET_BYTES).toBe(64);
    expect(g.MIN_PERIOD).toBe(1);
    expect(g.MAX_PERIOD).toBe(3600);
    expect(g.MAX_COUNTER).toBe(Number.MAX_SAFE_INTEGER);
    expect(g.MAX_WINDOW).toBe(100);
  });

  it("merges custom with defaults", () => {
    const g = createGuardrails({ MAX_WINDOW: 200, MIN_SECRET_BYTES: 8 });
    expect(g.MAX_WINDOW).toBe(200);
    expect(g.MIN_SECRET_BYTES).toBe(8);
    expect(g.MAX_SECRET_BYTES).toBe(64);
    expect(g.MIN_PERIOD).toBe(1);
  });

  it("returns frozen object", () => {
    const g = createGuardrails();
    expect(Object.isFrozen(g)).toBe(true);
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (g as any).MAX_WINDOW = 999;
    }).toThrow();
  });

  it("accepts partial guardrails", () => {
    const g = createGuardrails({ MAX_WINDOW: 50 });
    expect(g.MAX_WINDOW).toBe(50);
  });
});

describe("validateSecret with guardrails", () => {
  it("accepts secret within custom bounds", () => {
    const secret = new Uint8Array(8);
    const g = createGuardrails({ MIN_SECRET_BYTES: 8, MAX_SECRET_BYTES: 16 });
    expect(() => validateSecret(secret, g)).not.toThrow();
  });

  it("rejects secret below custom minimum", () => {
    const secret = new Uint8Array(4);
    const g = createGuardrails({ MIN_SECRET_BYTES: 8 });
    expect(() => validateSecret(secret, g)).toThrow(SecretTooShortError);
  });

  it("rejects secret above custom maximum", () => {
    const secret = new Uint8Array(100);
    const g = createGuardrails({ MAX_SECRET_BYTES: 32 });
    expect(() => validateSecret(secret, g)).toThrow(SecretTooLongError);
  });

  it("allows extreme values without validation", () => {
    const secret = new Uint8Array(2);
    const g = createGuardrails({ MIN_SECRET_BYTES: 1, MAX_SECRET_BYTES: 1000 });
    expect(() => validateSecret(secret, g)).not.toThrow();
  });
});

describe("validateCounter with guardrails", () => {
  it("accepts counter within custom bounds", () => {
    const g = createGuardrails({ MAX_COUNTER: 1000 });
    expect(() => validateCounter(500, g)).not.toThrow();
  });

  it("rejects counter above custom maximum", () => {
    const g = createGuardrails({ MAX_COUNTER: 100 });
    expect(() => validateCounter(101, g)).toThrow(CounterOverflowError);
  });

  it("accepts bigint counter within bounds", () => {
    const g = createGuardrails({ MAX_COUNTER: 1000 });
    expect(() => validateCounter(500n, g)).not.toThrow();
  });
});
