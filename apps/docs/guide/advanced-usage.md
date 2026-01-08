# Advanced Usage

This guide covers advanced topics for managing secrets, verifying tokens, and configuring internal behavior.

## Secret Management

### Secret Normalization

The built-in Base32 plugin (`ScureBase32Plugin`) automatically handles secret normalization:

- **Case Insensitivity**: Converts input to uppercase.
- **Padding**: Adds or ignores `=` padding as needed.

This means you can strictly pass the secret string without manual preprocessing:

```typescript
import { generate } from "otplib";

// All these work identically:
await generate({ secret: "JBSWY3DPEHPK3PXPJBSWY3DPEQ", ... });
await generate({ secret: "jbswy3dpehpk3pxpjbswy3dpeq", ... }); // Lowercase
await generate({ secret: "JBSWY3DPEHPK3PXPJBSWY3DPEQ====", ... }); // Padded
```

### Input Validation

To validate user input before processing:

```typescript
function isValidBase32(value: string): boolean {
  // Base32 alphabet: A-Z (excluding I, L, O, U) and 2-7
  const base32Regex = /^[A-Z2-7]+=*$/;
  return value && base32Regex.test(value.toUpperCase());
}
```

## Token Verification

### Verification Tolerance

OTP verification supports tolerance parameters to handle clock drift (TOTP) or counter desynchronization (HOTP).

#### TOTP (Time-Based) - epochTolerance

The `epochTolerance` parameter accepts tokens valid within a time window (in seconds):

- `epochTolerance: 0` - Exact match only (most secure)
- `epochTolerance: 30` - Accept tokens valid within ±30 seconds (symmetric)
- `epochTolerance: [5, 0]` - RFC-compliant: accept past only (5 seconds)

```typescript
import { verify } from "otplib";

// Allow ±30 seconds tolerance
const result = await verify({
  secret,
  token,
  epochTolerance: 30,
});
```

#### HOTP (Counter-Based) - counterTolerance

For HOTP, `counterTolerance` defines how many counters ahead to check:

```typescript
// Use HOTP strategy
import { verify } from "otplib";

const result = await verify({
  secret,
  token,
  strategy: "hotp",
  counter: currentCounter,
  counterTolerance: 10,
});

if (result.valid) {
  // AUTOMATICALLY UPDATE COUNTER
  // result.delta indicates how far ahead the match was found
  const newCounter = currentCounter + result.delta + 1;
  await saveCounter(userId, newCounter);
}
```

## Configuration & formats

### Padding Control

When encoding secrets, you can control whether padding is included:

```typescript
import { ScureBase32Plugin } from "otplib";
const base32 = new ScureBase32Plugin();

// Unpadded (Recommended for Authenticator apps)
const unpadded = base32.encode(bytes, { padding: false });
// "JBSWY3DPEHPK3PXP"

// Padded (RFC compliance)
const padded = base32.encode(bytes, { padding: true });
// "JBSWY3DPEHPK3PXP="
```

::: warning Default is `false`
By default, padding is disabled for compatibility with Google Authenticator.
For strict RFC Compliance, enable padding.
:::

### Algorithm Selection

Google Authenticator and most standard apps use **SHA-1**.

```typescript
import { generate } from "otplib";

// Using SHA-256
const token = await generate({
  secret,
  algorithm: "sha256",
});
```

### Custom Secret Lengths

You can generate secrets of specific lengths:

```typescript
import { generateSecret } from "otplib";

// 32 bytes for SHA-256
const secret = generateSecret(32);
```

### Working with Raw Bytes

For maximum performance or internal systems, you can work directly with `Uint8Array` instead of Base32 strings.

```typescript
import { generate, verify, NobleCryptoPlugin } from "otplib";

const crypto = new NobleCryptoPlugin();

// Generate raw bytes directly from crypto plugin
const secretBytes = crypto.randomBytes(20); // Uint8Array(20)

// Pass directly to generate/verify
// No Base32 plugin needed when using Uint8Array!
const token = await generate({
  secret: secretBytes,
  crypto,
});

const result = await verify({
  secret: secretBytes,
  token,
  crypto,
});
```

## Safe Execution (Result Pattern)

When using `generate` or `verify` methods, the library may throw errors (e.g., `SecretTooShortError`, `TokenLengthError`).
Instead of using `try/catch` blocks, you can use `wrapResult` (sync) or `wrapResultAsync` (async) to handle operations using the Result pattern.
These utilities return an `OTPResult` object which discriminates on the `ok` property.

### Synchronous Usage

Wrap synchronous functions like `otp.generate` or `otp.verify` (when used with synchronous plugins):

```typescript
import { wrapResult, generate, OTPError } from "otplib";

// 1. Create your wrapped function
// Note: Types are automatically inferred
const safeGenerate = wrapResult(generate);

// 2. Call it
const result = safeGenerate({ secret: "too-short" });

// 3. Handle the result
if (result.ok) {
  // result.value is the generated token (string)
  console.log("Token:", result.value);
} else {
  // result.error is the caught error (OTPError)
  console.error("Failed:", result.error.message);

  if (result.error instanceof OTPError) {
    // Handle specific error types
  }
}
```

### Asynchronous Usage

Wrap asynchronous functions like `otp.generate` or `otp.verify` (when used with async plugins like Web Crypto):

```typescript
import { wrapResultAsync, verify } from "otplib";

// 1. Create your wrapped function
const safeVerify = wrapResultAsync(verify);

// 2. Call it
const result = await safeVerify({
  token: "123456",
  secret: "JBSWY3DPEHPK3PXP",
});

if (result.ok) {
  // result.value is { delta: number, valid: boolean }
  if (result.value.valid) {
    console.log("Valid!");
  }
} else {
  console.error("Verification failed:", result.error);
}
```

## Error Handling

otplib provides a comprehensive error hierarchy that helps you identify and handle specific failure conditions. All errors extend from the base `OTPError` class and support error chaining via the ES2022 `cause` property.

### Error Hierarchy

```
OTPError (base class)
├── SecretError
│   ├── SecretTooShortError
│   └── SecretTooLongError
├── CounterError
│   ├── CounterNegativeError
│   └── CounterOverflowError
├── TimeError
│   └── TimeNegativeError
├── PeriodError
│   ├── PeriodTooSmallError
│   └── PeriodTooLargeError
├── TokenError
│   ├── TokenLengthError
│   └── TokenFormatError
├── CryptoError
│   ├── HMACError
│   └── RandomBytesError
├── Base32Error
│   ├── Base32EncodeError
│   └── Base32DecodeError
├── WindowError
│   └── WindowTooLargeError
├── CounterToleranceError
│   └── CounterToleranceTooLargeError
├── EpochToleranceError
│   ├── EpochToleranceNegativeError
│   └── EpochToleranceTooLargeError
├── PluginError
│   ├── CryptoPluginMissingError
│   └── Base32PluginMissingError
└── ConfigurationError
    ├── SecretMissingError
    ├── LabelMissingError
    ├── IssuerMissingError
    └── SecretTypeError
```

### Catching Specific Errors

You can catch specific error types to handle different failure modes:

```typescript
import {
  generate,
  SecretTooShortError,
  TokenFormatError,
  CryptoPluginMissingError,
  OTPError,
} from "otplib";

try {
  const token = await generate({ secret, crypto });
} catch (error) {
  if (error instanceof SecretTooShortError) {
    console.error("Secret must be at least 16 bytes");
  } else if (error instanceof CryptoPluginMissingError) {
    console.error("Please provide a crypto plugin");
  } else if (error instanceof OTPError) {
    // Handle any other otplib error
    console.error("OTP operation failed:", error.message);
  } else {
    throw error; // Re-throw unexpected errors
  }
}
```

### Error Chaining with `cause`

When errors originate from underlying plugins (crypto or Base32), otplib wraps them while preserving the original error via the `cause` property. This enables powerful debugging capabilities:

```typescript
import { Base32DecodeError, HMACError } from "@otplib/core";

try {
  const decoded = base32Context.decode("invalid!@#");
} catch (error) {
  if (error instanceof Base32DecodeError) {
    // Access the otplib error
    console.log("otplib error:", error.message);
    // → "Base32 decoding failed: Invalid character at position 7"

    // Access the original plugin error for debugging
    console.log("Original error:", error.cause);
    // → Error: Invalid character at position 7 (from @scure/base)
  }
}
```

### Debugging with Error Chains

For complex debugging scenarios, you can traverse the error chain:

```typescript
function logErrorChain(error: Error, depth = 0): void {
  const indent = "  ".repeat(depth);
  console.log(`${indent}${error.name}: ${error.message}`);

  if (error.cause instanceof Error) {
    logErrorChain(error.cause, depth + 1);
  }
}

try {
  await generate({ secret: "invalid", crypto });
} catch (error) {
  if (error instanceof Error) {
    logErrorChain(error);
  }
}
// Output:
// Base32DecodeError: Base32 decoding failed: Invalid character
//   Error: Invalid character at position 5
```

### Error Types Reference

| Error Class                     | When Thrown                              |
| ------------------------------- | ---------------------------------------- |
| `AlgorithmError`                | Invalid algorithm (not sha1/sha256/etc)  |
| `Base32DecodeError`             | Base32 decoding fails (invalid input)    |
| `Base32EncodeError`             | Base32 encoding fails                    |
| `Base32PluginMissingError`      | String secret but no Base32 plugin       |
| `CounterToleranceTooLargeError` | Counter tolerance exceeds maximum (100)  |
| `CryptoPluginMissingError`      | No crypto plugin provided                |
| `DigitsError`                   | Invalid digits configuration (not 6-8)   |
| `EpochToleranceTooLargeError`   | Tolerance exceeds maximum (3000 seconds) |
| `HMACError`                     | HMAC computation fails in crypto plugin  |
| `RandomBytesError`              | Random byte generation fails             |
| `SecretTooLongError`            | Secret exceeds 64 bytes                  |
| `SecretTooShortError`           | Secret is less than 16 bytes             |
| `TokenFormatError`              | Token contains non-numeric characters    |
| `TokenLengthError`              | Token doesn't match expected digit count |
