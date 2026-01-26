# Advanced Usage

This guide covers advanced topics for managing secrets, verifying tokens, and configuring internal behavior.

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

##### Reference Window Examples

| epochTolerance | period | Effective window (seconds)  | Typical meaning            |
| -------------- | ------ | --------------------------- | -------------------------- |
| `0`            | `30`   | `[epoch, epoch]`            | Exact period only          |
| `5`            | `30`   | `epoch ± 5`                 | Small clock drift          |
| `30`           | `30`   | `epoch ± 30`                | One adjacent period        |
| `60`           | `30`   | `epoch ± 60`                | Two adjacent periods       |
| `[5, 0]`       | `30`   | `epoch - 5` to `epoch`      | Past-only (RFC-aligned)    |
| `[5, 30]`      | `30`   | `epoch - 5` to `epoch + 30` | Asymmetric drift allowance |

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

| Use Case         | TOTP epochTolerance | HOTP counterTolerance |
| ---------------- | ------------------- | --------------------- |
| Maximum security | `0`                 | `0`                   |
| High security    | `5` or `[5, 0]`     | `0`                   |
| Standard 2FA     | `30`                | `5`                   |
| Lenient (mobile) | `60`                | `10`                  |

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
```

**Tuple format** (explicit control):

```typescript
import { verify } from "otplib";

const result = await verify({
  secret,
  token,
  strategy: "hotp",
  counter: currentCounter,
  counterTolerance: [5, 5], // Check ±5 counters (symmetric)
});
```

### Replay Protection (HOTP)

After successful HOTP verification, persist the updated counter in your system.

```typescript
if (result.valid) {
  // Update and persist your counter to prevent replay
  // Example:
  updateCounter(currentCounter + result.delta + 1);
}
```

### Replay Protection (TOTP)

By default, TOTP codes can be reused within their validity period (determined by `epochTolerance`). To prevent replay attacks, you can track the time step from each successful verification and use the `afterTimeStep` parameter to reject previously used time steps.

#### How Replay Protection Works

The `afterTimeStep` parameter specifies an **exclusive lower bound** for valid time steps. Time steps less than or equal to this value are rejected during verification.

```typescript
import { verify } from "otplib";

// First verification - user provides token
const result1 = await verify({
  secret,
  token: "123456",
});

if (result1.valid) {
  // Save the time step for replay protection
  const timeStep = result1.timeStep; // e.g., 41152263
  await database.saveLastTimeStep(userId, timeStep);
}

// Second verification - same token would be rejected
const lastTimeStep = await database.getLastTimeStep(userId);
const result2 = await verify({
  secret,
  token: "123456", // Same token
  afterTimeStep: lastTimeStep, // Reject timeStep <= 41152263
});

console.log(result2.valid); // false - replay rejected!

// Third verification - new token is accepted
const result3 = await verify({
  secret,
  token: "789012", // New token from later time step
  afterTimeStep: lastTimeStep,
});

console.log(result3.valid); // true - new token accepted
```

#### Verification Return Value

All successful TOTP verifications now include the `timeStep` property:

```typescript
const result = await verify({
  secret,
  token,
});

if (result.valid) {
  console.log(result.timeStep); // 41152263 (the actual time step used)
  console.log(result.delta); // 0 (offset from current time step)
  console.log(result.epoch); // 1234578900 (Unix timestamp)
}
```

#### Combined with epochTolerance

The `afterTimeStep` parameter works seamlessly with `epochTolerance`:

```typescript
// At epoch 90 (time step 3) with tolerance 30
// Window covers time steps [1, 2, 3, 4, 5]

const result = await verify({
  secret,
  token,
  epoch: 90,
  epochTolerance: 30, // Allow time steps [1, 2, 3, 4, 5]
  afterTimeStep: 2, // Reject time steps <= 2, allowing only [3, 4, 5]
});

// Result: Tokens from time steps 1 and 2 are rejected
//         Tokens from time steps 3, 4, 5 are accepted
```

#### Validation Rules

The `afterTimeStep` parameter is validated according to these rules:

| Condition                       | Error                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Negative value                  | `afterTimeStep must be >= 0`                                                  |
| Non-integer value (e.g., `1.5`) | `Invalid afterTimeStep: non-integer value`                                    |
| Exceeds max possible time step  | `Invalid afterTimeStep: cannot be greater than current time step plus window` |

Note: Values below the current window are allowed; they simply reject older time steps.

```typescript
// Throws: afterTimeStep must be >= 0
await verify({ secret, token, afterTimeStep: -1 });

// Throws: Invalid afterTimeStep: non-integer value
await verify({ secret, token, afterTimeStep: 1.5 });

// Throws: Invalid afterTimeStep: cannot be greater than current time step plus window
// (when current time step + window < 100)
await verify({ secret, token, afterTimeStep: 100 });
```

#### Complete Example with Database

Here's a complete example showing how to implement replay protection in a real application:

```typescript
import { verify, generate } from "otplib";
import { Database } from "your-database";

const db = new Database();

async function login(userId: string, token: string): Promise<boolean> {
  // Get user's secret and last used time step
  const { secret, lastTimeStep } = await db.getUser(userId);

  // Verify token with replay protection
  const result = await verify({
    secret,
    token,
    afterTimeStep: lastTimeStep, // Reject previously used time steps
  });

  if (result.valid) {
    // Update last used time step to prevent reuse
    await db.updateLastTimeStep(userId, result.timeStep);
    return true;
  }

  return false;
}

// Usage
const success = await login("user-123", "123456");
if (success) {
  console.log("Login successful!");
} else {
  console.log("Invalid token or token already used");
}
```

#### Security Considerations

**State Management**: The application is responsible for storing and managing the `lastTimeStep` value. Common approaches:

- **Database**: Store in user table (recommended for production)
- **Session**: Store in session memory (for simple applications)
- **Cache**: Redis/Memcached (for high-traffic scenarios)

**Race Conditions**: `afterTimeStep` does not prevent concurrent verification race conditions. If two verification requests arrive simultaneously with the same token, both might succeed. Use database transactions or locks to prevent this:

```typescript
import { verify } from "otplib";
import { Transaction } from "your-database";

async function verifyWithLock(userId: string, token: string) {
  return Transaction.run(async (tx) => {
    // Lock user row during verification
    const user = await tx.users.lock(userId);

    const result = await verify({
      secret: user.secret,
      token,
      afterTimeStep: user.lastTimeStep,
    });

    if (result.valid) {
      await tx.users.update(userId, { lastTimeStep: result.timeStep });
    }

    return result.valid;
  });
}
```

**Clock Synchronization**: For proper replay protection, ensure your server clock is synchronized via NTP. Incorrect server time can cause `afterTimeStep` to reject valid tokens or accept expired ones.

```typescript
const result = await verify({
  secret,
  token,
});

if (result.valid) {
  console.log(result.timeStep); // 41152263 (the actual time step used)
  console.log(result.delta); // 0 (offset from current time step)
  console.log(result.epoch); // 1234578900 (Unix timestamp)
}
```

## Configuration & formats

### Padding Control

When encoding secrets, you can control whether padding is included:

```typescript
import { base32 } from "otplib";

// Unpadded (Recommended for Authenticator apps)
const unpadded = base32.encode(bytes, { padding: false });
// "GEZDGNBVGY3TQOJQGEZDGNBVGY"

// Padded (RFC compliance)
const padded = base32.encode(bytes, { padding: true });
// "GEZDGNBVGY3TQOJQGEZDGNBVGY="
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
import { generate, verify, crypto } from "otplib";

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

Wrap synchronous functions like `otp.generateSync` or `otp.verifySync` (when used with synchronous plugins):

```typescript
import { wrapResult, generateSync, OTPError } from "otplib";

// 1. Create your wrapped function
// Note: Types are automatically inferred
const safeGenerate = wrapResult(generateSync);

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
  secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY",
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
├── AfterTimeStepError
│   ├── AfterTimeStepNegativeError
│   ├── AfterTimeStepNotIntegerError
│   └── AfterTimeStepRangeExceededError
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

### Error Types Reference

| Error Class                       | When Thrown                                      |
| --------------------------------- | ------------------------------------------------ |
| `AlgorithmError`                  | Invalid algorithm (not sha1/sha256/etc)          |
| `AfterTimeStepRangeExceededError` | `afterTimeStep` exceeds max possible time step   |
| `AfterTimeStepNegativeError`      | `afterTimeStep` is negative                      |
| `AfterTimeStepNotIntegerError`    | `afterTimeStep` is not an integer (e.g., 1.5)    |
| `AfterTimeStepError`              | Base class for `afterTimeStep` validation errors |
| `Base32DecodeError`               | Base32 decoding fails (invalid input)            |
| `Base32EncodeError`               | Base32 encoding fails                            |
| `Base32PluginMissingError`        | String secret but no Base32 plugin               |
| `CounterNegativeError`            | Counter is negative                              |
| `CounterOverflowError`            | Counter exceeds max safe integer                 |
| `CounterToleranceNegativeError`   | Counter tolerance contains negatives             |
| `CounterToleranceTooLargeError`   | Counter tolerance exceeds maximum (100)          |
| `CryptoPluginMissingError`        | No crypto plugin provided                        |
| `DigitsError`                     | Invalid digits configuration (not 6-8)           |
| `EpochToleranceNegativeError`     | Epoch tolerance contains negatives               |
| `EpochToleranceTooLargeError`     | Tolerance exceeds maximum (3000 seconds)         |
| `HMACError`                       | HMAC computation fails in crypto plugin          |
| `IssuerMissingError`              | Missing issuer for URI generation                |
| `LabelMissingError`               | Missing label for URI generation                 |
| `PeriodTooLargeError`             | Period exceeds maximum                           |
| `PeriodTooSmallError`             | Period below minimum                             |
| `RandomBytesError`                | Random byte generation fails                     |
| `SecretMissingError`              | Secret missing from options                      |
| `SecretTooLongError`              | Secret exceeds 64 bytes                          |
| `SecretTooShortError`             | Secret is less than 16 bytes                     |
| `SecretTypeError`                 | Secret must be Base32 string for class           |
| `TimeNegativeError`               | Time is negative                                 |
| `TokenFormatError`                | Token contains non-numeric characters            |
| `TokenLengthError`                | Token doesn't match expected digit count         |
