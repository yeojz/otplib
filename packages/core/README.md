# @otplib/core

Core types, interfaces, and utilities for the otplib OTP library suite.

## Overview

`@otplib/core` provides the foundational abstractions for all otplib packages. It includes:

- **Type Definitions**: TypeScript interfaces for OTP operations
- **Error Classes**: Hierarchical error types for validation and crypto operations
- **Validation Utilities**: Input validation for secrets, counters, time, and tokens
- **Crypto Abstraction**: Pluggable crypto backend via `CryptoContext`
- **Base32 Abstraction**: Pluggable Base32 encoding/decoding via `Base32Context`

## Installation

```bash
npm install @otplib/core
pnpm add @otplib/core
yarn add @otplib/core
```

## Core Concepts

### Plugin Architecture

otplib uses a plugin architecture for both cryptographic operations and Base32 encoding:

```typescript
import type { CryptoPlugin, Base32Plugin } from "@otplib/core";

// Crypto plugins implement HMAC and random byte generation
interface CryptoPlugin {
  name: string;
  hmac(
    algorithm: HashAlgorithm,
    key: Uint8Array,
    data: Uint8Array,
  ): Uint8Array | Promise<Uint8Array>;
  randomBytes(length: number): Uint8Array;
}

// Base32 plugins implement encoding and decoding
interface Base32Plugin {
  name: string;
  encode(data: Uint8Array, options?: Base32EncodeOptions): string;
  decode(str: string): Uint8Array;
}
```

### CryptoContext

The `CryptoContext` class provides a unified interface for crypto operations:

```typescript
import { createCryptoContext } from "@otplib/core";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";

const crypto = createCryptoContext(new NodeCryptoPlugin());

// Async HMAC computation
const digest = await crypto.hmac("sha1", key, data);

// Sync HMAC computation
const digest = crypto.hmacSync("sha1", key, data);

// Random bytes
const secret = crypto.randomBytes(20);
```

### Base32Context

The `Base32Context` class provides a unified interface for Base32 operations:

```typescript
import { createBase32Context } from "@otplib/core";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const base32 = createBase32Context(new ScureBase32Plugin());

// Encode binary data to Base32
const encoded = base32.encode(new Uint8Array([1, 2, 3]), { padding: false });

// Decode Base32 string to binary
const decoded = base32.decode("MFRGGZDFMZTWQ");
```

## Validation Utilities

### Secret Validation

```typescript
import { validateSecret, MIN_SECRET_BYTES, RECOMMENDED_SECRET_BYTES } from "@otplib/core";

try {
  validateSecret(secretBytes);
} catch (error) {
  if (error instanceof SecretTooShortError) {
    console.error(`Secret must be at least ${MIN_SECRET_BYTES} bytes`);
  } else if (error instanceof SecretTooLongError) {
    console.error(`Secret must not exceed ${RECOMMENDED_SECRET_BYTES} bytes`);
  }
}
```

### Counter Validation

```typescript
import { validateCounter, MAX_COUNTER } from "@otplib/core";

try {
  validateCounter(123n);
  validateCounter(0);
} catch (error) {
  if (error instanceof CounterNegativeError) {
    console.error("Counter cannot be negative");
  } else if (error instanceof CounterOverflowError) {
    console.error(`Counter exceeds maximum (${MAX_COUNTER})`);
  }
}
```

### Time and Period Validation

```typescript
import { validateTime, validatePeriod, MIN_PERIOD, MAX_PERIOD } from "@otplib/core";

validateTime(Math.floor(Date.now() / 1000));
validatePeriod(30); // Default TOTP period
```

### Token Validation

```typescript
import { validateToken } from "@otplib/core";

try {
  validateToken("123456", 6);
} catch (error) {
  if (error instanceof TokenLengthError) {
    console.error("Token has incorrect length");
  } else if (error instanceof TokenFormatError) {
    console.error("Token must contain only digits");
  }
}
```

## Utility Functions

### Counter Conversion

```typescript
import { counterToBytes } from "@otplib/core";

// Convert counter to 8-byte big-endian array
const counterBytes = counterToBytes(42n);
// Output: Uint8Array [0, 0, 0, 0, 0, 0, 0, 42]
```

### Dynamic Truncation (RFC 4226)

```typescript
import { dynamicTruncate } from '@otplib/core';

// Extract 31-bit integer from HMAC result
const hmacResult = new Uint8Array([...]); // 20 bytes for SHA-1
const truncated = dynamicTruncate(hmacResult);
```

### OTP Generation

```typescript
import { truncateDigits } from "@otplib/core";

// Convert truncated value to OTP string
const otp = truncateDigits(123456789, 6);
// Output: "456789"
```

### Constant-Time Comparison

```typescript
import { constantTimeEqual } from "@otplib/core";

// Timing-safe comparison to prevent timing attacks
const isValid = constantTimeEqual("123456", "123456");
const isValid = constantTimeEqual(uint8Array1, uint8Array2);
```

## Error Handling

All errors extend from `OTPError`:

```typescript
import {
  OTPError,
  SecretError,
  SecretTooShortError,
  SecretTooLongError,
  CounterError,
  CounterNegativeError,
  CounterOverflowError,
  TimeError,
  PeriodError,
  TokenError,
  TokenLengthError,
  TokenFormatError,
  CryptoError,
  HMACError,
  RandomBytesError,
} from "@otplib/core";

// Check error types
try {
  // ... OTP operation
} catch (error) {
  if (error instanceof SecretTooShortError) {
    // Handle short secret
  } else if (error instanceof CryptoError) {
    // Handle crypto failure
  }
}
```

## Type Definitions

### Hash Algorithms

```typescript
type HashAlgorithm = "sha1" | "sha256" | "sha512";
```

### OTP Digits

```typescript
type Digits = 6 | 7 | 8;
```

### HOTP Options

```typescript
interface HOTPOptions {
  secret: Uint8Array;
  counter: number | bigint;
  algorithm?: HashAlgorithm;
  digits?: Digits;
}
```

### TOTP Options

```typescript
interface TOTPOptions {
  secret: Uint8Array;
  epoch?: number; // Unix time in seconds
  algorithm?: HashAlgorithm;
  digits?: Digits;
  period?: number; // Time step in seconds (default: 30)
}
```

### Verification Options

```typescript
interface HOTPVerifyOptions extends HOTPOptions {
  token: string;
  counterTolerance?: number | number[]; // Look-ahead window
}

interface TOTPVerifyOptions extends TOTPOptions {
  token: string;
  epochTolerance?: number | [number, number]; // Time tolerance in seconds
}

interface VerifyResult {
  valid: boolean;
  delta?: number; // Counter/time steps from expected value
}
```

## Related Packages

- `@otplib/hotp` - HOTP implementation
- `@otplib/totp` - TOTP implementation
- `@otplib/plugin-crypto-node` - Node.js crypto plugin
- `@otplib/plugin-crypto-web` - Web Crypto API plugin
- `@otplib/plugin-base32-scure` - Base32 plugin using @scure/base

## Documentation

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE) © 2026 Gerald Yeo
