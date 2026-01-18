# Advanced Usage

This guide covers advanced topics for managing secrets, verifying tokens, and configuring internal behavior.

## Secret Handling

### Base32 by Default

::: warning Important
String secrets are treated as Base32-encoded strings by default.
:::

This aligns with mainstream authenticator apps that expect Base32 secrets.

### Non-Base32 Secrets (Passphrases)

String secrets are treated as Base32 by default. For non-Base32 strings, a Base32 bypass plugin can handle the conversion; see [Base32 bypass plugins](/guide/plugins#otplibplugin-base32-bypass) for details.

### Input Validation

To validate if a user's input is valid Base32 before processing:

```typescript
function isValidBase32(value: string): boolean {
  // Base32 alphabet: A-Z and 2-7 (RFC 4648)
  const base32Regex = /^[A-Z2-7]+=*$/;
  return value && base32Regex.test(value.toUpperCase());
}
```

## Token Verification

### Verification Tolerance

OTP verification supports tolerance parameters to accommodate clock drift (TOTP) or counter desynchronization (HOTP).

#### TOTP (Time-Based) - epochTolerance

The `epochTolerance` parameter defines the range of time periods to check during verification. This is useful when the client and server clocks are not perfectly synchronized.

##### How Tolerance Works

The `epochTolerance` setting specifies a tolerance window around the current time. It does not represent a strict duration in seconds (e.g., "±N seconds"), but rather dictates which **periods** overlap with the tolerance window `[currentTime - tolerance, currentTime + tolerance]`.

The verification process checks:

1. The current time period.
2. Any periods that overlap with the specified tolerance window.

If the token matches any of these periods, it is considered valid.

**Basic usage:**

```typescript
import { verify } from "otplib";

// Symmetric tolerance (±30 seconds)
const result = await verify({
  secret,
  token,
  epochTolerance: 30,
});

// Asymmetric tolerance (5s past, 0s future - RFC-compliant)
const result = await verify({
  secret,
  token,
  epochTolerance: [5, 0],
});
```

##### Understanding the Window

With `period: 30` (default) and `epochTolerance: 5`, the server checks a window of time around the current timestamp.

```
Time:     50    55    60    65    70
Period:   [---- C1 ---][---- C2 ---][---- C3 ----]
Window:           [----5s----^----5s----]
                        (server at 60)

Accepted periods: C1 (overlaps window), C2 (current), C3 (overlaps window)
```

In this example, even though the tolerance is set to 5 seconds, tokens generated anywhere within period C1 (30-60) are accepted because the tolerance window overlaps with that period.

##### The Same-Period Limitation

TOTP tokens are generated based on a time period (counter), not the exact second. This means all timestamps within the same period (e.g., 30s) produce the identical token.

```typescript
// Server time: 60 (start of period 2)
// Tolerance: 5 seconds → Window [55, 65]

// Token generated at epoch 59 (1 second ago)
const token59 = await generate({ secret, epoch: 59, period: 30 });

// Token generated at epoch 54 (6 seconds ago)
const token54 = await generate({ secret, epoch: 54, period: 30 });

// Both timestamps fall in period 1: floor(59/30) = floor(54/30) = 1
// Therefore, they produce the same token.
console.log(token59 === token54); // true

// Both are accepted because period 1 [30, 60) overlaps the tolerance window [55, 65]
const result59 = await verify({ secret, token: token59, epoch: 60, epochTolerance: 5 });
const result54 = await verify({ secret, token: token54, epoch: 60, epochTolerance: 5 });

console.log(result59.valid); // true
console.log(result54.valid); // true
```

##### Security Considerations

Setting a smaller `epochTolerance` reduces the window of time in which a token is accepted.

**Comparison: 5 Seconds vs 30 Seconds**

Using a smaller tolerance (e.g., 5 seconds) restricts the acceptance window more effectively than a larger tolerance (e.g., 30 seconds).

1.  **Start of a new period:**
    - With `epochTolerance: 30`, a token from the previous period remains valid for the entire duration of the current period (30s).
    - With `epochTolerance: 5`, a token from the previous period is only valid for the first 5 seconds of the current period.

2.  **Middle of a period:**
    A larger tolerance might overlap with multiple adjacent periods, potentially accepting tokens from further in the past or future. A smaller tolerance limits this overlap to typically just the immediate adjacent periods.

##### Recommended Values

- **Maximum Security**: `epochTolerance: 0` (Accepts only the current period; requires synchronized clocks).
- **High Security**: `epochTolerance: 5` or `[5, 0]` (Allows for small network delays; RFC 6238 recommends avoiding future tolerance).
- **Standard**: `epochTolerance: 30` (Balances security and user convenience).
- **Lenient**: `epochTolerance: 60` (Useful for environments with poor network conditions or unsynchronized clocks).

##### Asymmetric Tolerance (RFC-Compliant)

RFC 6238 suggests accepting tokens from the recent past to account for transmission delays, but rejecting tokens from the future to prevent potential clock manipulation.

```typescript
// Accept tokens from 5 seconds in the past, reject future tokens
const result = await verify({
  secret,
  token,
  epochTolerance: [5, 0], // [past, future]
});
```

##### Best Practices

1.  **Choose an appropriate tolerance**
    Start with a smaller tolerance (e.g., 5 seconds) and adjust if necessary based on user feedback or network conditions.

2.  **Consider asymmetric tolerance**
    For higher security, prefer `[5, 0]` to allow for network delays without accepting future tokens.

3.  **Implement rate limiting**
    Limit failed verification attempts per user to protect against brute-force attacks.

4.  **Monitor verification deltas**

    ```typescript
    const result = await verify({ secret, token, epochTolerance: 30 });
    if (result.valid && result.delta !== 0) {
      console.warn(`Clock drift detected: ${result.delta} periods`);
    }
    ```

#### HOTP (Counter-Based) - counterTolerance

For HOTP, `counterTolerance` defines the verification window:

**Number format** (look-ahead only, recommended):

```typescript
import { verify } from "otplib";

const result = await verify({
  secret,
  token,
  strategy: "hotp",
  counter: currentCounter,
  counterTolerance: 10, // Checks current + 10 future counters
});

if (result.valid) {
  // Update counter to prevent replay
  const newCounter = currentCounter + result.delta + 1;
  await updateCounter(userId, newCounter);
}
```

**Tuple format** (explicit control):

```typescript
const result = await verify({
  secret,
  token,
  strategy: "hotp",
  counter: currentCounter,
  counterTolerance: [5, 5], // Check ±5 counters (symmetric)
});
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

::: info Default is `false`
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
  // result.value is { valid: true; delta: number; epoch?: number }
  if (result.value.valid) {
    console.log("Valid!");
    console.log("Matched at epoch:", result.value.epoch);
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
