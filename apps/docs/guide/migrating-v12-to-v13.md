# Migration Guide: v12 to v13

This guide covers the breaking changes and migration steps from otplib v12 to v13.

## Overview of Changes

v13 introduces a **complete rewrite** with the following major changes:

1. **Plugin-based architecture** - Crypto and Base32 implementations are now pluggable
2. **Async-first API** - All token generation and verification is now async
3. **TypeScript-first** - Full type safety with comprehensive type definitions
4. **Modular packages** - Use only what you need with scoped packages
5. **Functional-First API** - Functional API is now recommended over Class API for tree-shaking and simplicity

## Quick Migration

### Using the v12 Adapter (Drop-in Replacement)

If you want to upgrade to v13 internals but keep your existing v12 code working without changes, use the `@otplib/v12-adapter` package.

```bash
npm install @otplib/v12-adapter
```

Then update your imports:

```typescript
// v12
import { authenticator } from "otplib";

// v13 with Adapter
import { authenticator } from "@otplib/v12-adapter";
```

This adapter mimics the v12 synchronous API while using v13's plugins under the hood.

::: info Recommendation
You are still recommended to do a full migration to use v13 directly for full compatibility and future-proofing.
:::

::: warning Class/Instance API Only
This adapter only exports the `authenticator`, `totp`, and `hotp` singleton instances and their classes. If you were importing specific utility functions directly from `otplib/core` or other internal paths in v12, those are not covered by this adapter.
:::

## Full Migration

### Using the Main Package

If you want minimal changes, use the `otplib` package which includes default plugins:

```typescript
// v12
import { authenticator } from "otplib";

const secret = authenticator.generateSecret();
const token = authenticator.generate(secret);
const isValid = authenticator.verify({ token, secret });

// v13 - Using the Functional API (Recommended)
import { generateSecret, generate, verify } from "otplib";

const secret = generateSecret();
const token = await generate({ secret });
const result = await verify({ secret, token });
const isValid = result.valid;

// v13 - Using the OTP class
import { OTP } from "otplib";

const otp = new OTP();
const secret = otp.generateSecret();
const token = await otp.generate({ secret });
const result = await otp.verify({ secret, token });
const isValid = result.valid;
```

### Using Individual Packages

```typescript
// v13 with explicit plugins
import { generate, verify } from "@otplib/totp";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();

const token = await generate({
  secret: "JBSWY3DPEHPK3PXP",
  crypto,
  base32,
});

const result = await verify({
  secret: "JBSWY3DPEHPK3PXP",
  token,
  crypto,
  base32,
});
```

## Breaking Changes

### 1. Async API

All `generate()` and `verify()` functions are now async:

```typescript
// v12 (synchronous)
const token = authenticator.generate(secret);

// v13 (async)
const token = await generate({ secret });
```

### 2. Plugin Injection Required

v13 requires explicit crypto and base32 plugins (except when using the `otplib` package):

```typescript
// v13 - must provide plugins
import { generate } from "@otplib/hotp";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const token = await generate({
  secret: "JBSWY3DPEHPK3PXP",
  counter: 0,
  crypto: new NodeCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});
```

### 3. Options Object Pattern

Functions now take a single options object instead of positional arguments:

```typescript
// v12
authenticator.generate(secret);
authenticator.verify({ token, secret });

// v13
generate({ secret, crypto, base32 });
verify({ secret, token, crypto, base32 });
```

### 4. Verify Returns Object

`verify()` now returns a result object instead of a boolean:

```typescript
// v12
const isValid = authenticator.verify({ token, secret }); // boolean

// v13
const result = await verify({ secret, token }); // { valid: boolean, delta?: number }
const isValid = result.valid;
const delta = result.delta; // 0 = exact match, +/- for window offset
```

### 5. Secret Format Changes

v13 accepts both Base32 strings and raw `Uint8Array`:

```typescript
// Base32 string (requires base32 plugin)
await generate({
  secret: 'JBSWY3DPEHPK3PXP',
  crypto,
  base32, // required for string secrets
});

// Raw bytes (no base32 plugin needed)
await generate({
  secret: new Uint8Array([...]),
  crypto,
});
```

### 6. Class-Based API Changes

The class API has been updated:

```typescript
// v12
import { authenticator } from "otplib";
authenticator.options = { digits: 8 };
const token = authenticator.generate(secret);

// v13 - Using the unified OTP class (new)
import { OTP } from "otplib";

const otp = new OTP({
  strategy: "totp", // 'totp' or 'hotp'
  digits: 8,
});

const token = await otp.generate({ secret: "JBSWY3DPEHPK3PXP" });

// v13 - Using strategy-specific classes
import { TOTP } from "otplib";

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
  digits: 8,
});

totp.secret = "JBSWY3DPEHPK3PXP";
const token = await totp.generate();
```

### 7. Unified Strategy Support

v13.1 introduces a unified API that supports multiple strategies through a single interface:

```typescript
import { OTP, generate, verify } from "otplib";

// Using the OTP class with different strategies
const totp = new OTP({ strategy: "totp" });
const hotp = new OTP({ strategy: "hotp" });

// Using functional API with strategy parameter
const token1 = await generate({ secret, strategy: "totp" });
const token2 = await generate({ secret, strategy: "hotp", counter: 0 });
```

## Package Mapping

| v12 Package            | v13 Package(s)                               |
| ---------------------- | -------------------------------------------- |
| `otplib`               | `otplib` (all-in-one) or individual packages |
| `otplib/authenticator` | `@otplib/totp`                               |
| `otplib/hotp`          | `@otplib/hotp`                               |
| `otplib/totp`          | `@otplib/totp`                               |
| (built-in)             | `@otplib/plugin-crypto-node`                 |
| (built-in)             | `@otplib/plugin-crypto-noble`                |
| (built-in)             | `@otplib/plugin-crypto-web`                  |
| (built-in)             | `@otplib/plugin-base32-scure`                |
| `@otplib/core`         | `@otplib/core`                               |

## Choosing Crypto Plugins

v13 offers three crypto plugins:

### NodeCryptoPlugin (Node.js only)

```typescript
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
```

- Uses Node.js built-in `crypto` module
- Synchronous HMAC operations
- Best performance for Node.js applications

### NobleCryptoPlugin (Universal)

```typescript
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
```

- Pure JavaScript implementation using `@noble/hashes`
- Synchronous HMAC operations
- Works in Node.js, browsers, and edge runtimes
- **Default in `otplib` package**

### WebCryptoPlugin (Browsers)

```typescript
import { WebCryptoPlugin } from "@otplib/plugin-crypto-web";
```

- Uses Web Crypto API
- Async HMAC operations (hardware accelerated)
- Best for browser environments with SubtleCrypto support

## Error Handling

v13 introduces specific error types:

```typescript
import {
  OTPError,
  SecretError,
  SecretTooShortError,
  TokenError,
  TokenLengthError,
  CryptoError,
} from "@otplib/core";

try {
  await generate({ secret: "short", crypto, base32 });
} catch (error) {
  if (error instanceof SecretTooShortError) {
    console.log("Secret must be at least 16 bytes");
  }
}
```

## URI Generation

```typescript
// v12
const uri = authenticator.keyuri("user@example.com", "MyApp", secret);

// v13 - functional
import { generateURI } from "@otplib/totp";
const uri = generateURI({
  issuer: "MyApp",
  label: "user@example.com",
  secret: "JBSWY3DPEHPK3PXP",
});

// v13 - class-based
const totp = new TOTP({
  issuer: "MyApp",
  label: "user@example.com",
  secret: "JBSWY3DPEHPK3PXP",
  crypto,
  base32,
});
const uri = totp.toURI();
```

## TypeScript Changes

v13 provides comprehensive types:

```typescript
import type {
  CryptoPlugin,
  Base32Plugin,
  HashAlgorithm,
  Digits,
  VerifyResult,
  HOTPOptions,
  TOTPOptions,
} from "@otplib/core";

// HashAlgorithm = "sha1" | "sha256" | "sha512"
// Digits = 6 | 7 | 8
// VerifyResult = { boolean: delta?: number }
```

## Tolerance Changes (`window` vs `tolerance`)

v13 replaces the ambiguous `window` option with explicit tolerance parameters:

- **TOTP**: Replaced `window` (steps) with `epochTolerance` (seconds).
- **HOTP**: Replaced `window` (steps) with `counterTolerance` (steps).

### TOTP: Migrating from `window`

In v12, `window` was defined in **steps** (typically 30 seconds).
In v13, `epochTolerance` is defined in **seconds**.

**Migration Formula:**
`epochTolerance = window * step`

| v12 `window` | v13 `epochTolerance` (assuming 30s step) | Description            |
| :----------- | :--------------------------------------- | :--------------------- |
| `0`          | `0`                                      | Exact match only       |
| `1`          | `30`                                     | ±1 step (±30 seconds)  |
| `[1, 0]`     | `[30, 0]`                                | Past 1 step (30s) only |
| `2`          | `60`                                     | ±2 steps (±60 seconds) |

```typescript
// v12
authenticator.options = { window: 1 }; // ±1 step

// v13
await verify({
  secret,
  token,
  epochTolerance: 30, // ±30 seconds
});
```

### TOTP - epochTolerance

The `epochTolerance` parameter provides precise control over time-based verification tolerance:

| Format           | Description                   | Example                                             |
| ---------------- | ----------------------------- | --------------------------------------------------- |
| `number`         | Symmetric tolerance (seconds) | `epochTolerance: 30` checks ±30 seconds             |
| `[past, future]` | Asymmetric tolerance          | `epochTolerance: [5, 0]` checks past 5 seconds only |

#### Standard Usage

```typescript
// Accept tokens valid within ±30 seconds
const result = await verify({
  secret: "JBSWY3DPEHPK3PXP",
  token: "123456",
  epochTolerance: 30, // Symmetric: [epoch-30, epoch+30]
  crypto,
  base32,
});
```

#### RFC-Compliant (Past Only)

```typescript
// RFC 6238 Section 5.2 - Accept past tokens only (transmission delay)
const result = await verify({
  secret: "JBSWY3DPEHPK3PXP",
  token: "123456",
  epochTolerance: [5, 0], // Checks [epoch-5, epoch] - past tokens only
  crypto,
  base32,
});
```

#### Asymmetric Tolerance

```typescript
// Different tolerances for past vs future
const result = await verify({
  secret: "JBSWY3DPEHPK3PXP",
  token: "123456",
  epochTolerance: [5, 30], // 5 seconds past, 30 seconds future
  crypto,
  base32,
});
```

### HOTP - counterTolerance

The `counterTolerance` parameter controls counter-based verification:

| Format     | Description      | Example                                                    |
| ---------- | ---------------- | ---------------------------------------------------------- |
| `number`   | Symmetric range  | `counterTolerance: 5` checks counters -5 to +5             |
| `number[]` | Specific offsets | `counterTolerance: [0, 1, 2]` checks exactly those offsets |

```typescript
// Look-ahead window for counter desynchronization
const result = await verify({
  secret: "JBSWY3DPEHPK3PXP",
  token: "123456",
  strategy: "hotp",
  counter: 10,
  counterTolerance: 5, // Check counters 5 to 15
  crypto,
  base32,
});

if (result.valid) {
  // Update counter to prevent replay
  const nextCounter = 10 + result.delta + 1;
  await saveCounter(userId, nextCounter);
}
```

### Recommended Tolerance Values

| Use Case         | TOTP epochTolerance | HOTP counterTolerance |
| ---------------- | ------------------- | --------------------- |
| High security    | `0` or `[5, 0]`     | `0`                   |
| Standard 2FA     | `30`                | `5`                   |
| Lenient (mobile) | `60`                | `10`                  |

## Need Help?

- [GitHub Issues](https://github.com/yeojz/otplib/issues)
- [API Documentation](https://github.com/yeojz/otplib)
