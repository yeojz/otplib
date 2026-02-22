# @otplib/core

Core types, interfaces, and utilities for the otplib OTP library suite.

## Overview

`@otplib/core` provides the foundational abstractions for all otplib packages:

- **Type Definitions** - TypeScript interfaces for OTP operations
- **Error Classes** - Hierarchical error types for validation and crypto operations
- **Validation Utilities** - Input validation for secrets, counters, time, and tokens
- **Crypto Abstraction** - Pluggable crypto backend via `CryptoContext`
- **Base32 Abstraction** - Pluggable Base32 encoding/decoding via `Base32Context`

This package is primarily used as a dependency by other otplib packages. Direct usage is only necessary when building custom plugins or extending the library.

> [!IMPORTANT] Breaking Changes (v13)
> The `totp` and `hotp` specific logic have been moved to their individual packages.
>
> See [Getting Started](https://otplib.yeojz.dev/guide/getting-started) for details.

## Installation

```bash
npm install @otplib/core
pnpm add @otplib/core
yarn add @otplib/core
```

## Usage

`@otplib/core` provides baseline functionality and definitions for the library suite. It defines the errors, input validations and the plugin interfaces.

### Catching specific error types

All otplib errors extend `OTPError`. Import concrete subclasses to distinguish them in a catch block.

```typescript
import { Base32DecodeError, HMACError, SecretTooShortError } from "@otplib/core";

try {
  const token = await generate({ secret, crypto, base32 });
} catch (err) {
  if (err instanceof SecretTooShortError) {
    // secret is fewer than 16 bytes (128 bits)
  } else if (err instanceof Base32DecodeError) {
    // secret string contained invalid Base32 characters
  } else if (err instanceof HMACError) {
    // the crypto plugin's HMAC operation failed; err.cause holds the original error
  }
}
```

### Validating inputs

Use the validation utilities before passing values to generation or verification functions.

```typescript
import { validateSecret, validateToken, validateCounter } from "@otplib/core";

// validateSecret accepts a decoded Uint8Array
validateSecret(decodedSecretBytes); // throws SecretTooShortError / SecretTooLongError

// validateToken checks length and digit-only format
validateToken(token, 6); // throws TokenLengthError or TokenFormatError

// validateCounter checks for negatives, non-integers, and overflow
validateCounter(counter); // throws CounterNegativeError / CounterNotIntegerError / CounterOverflowError
```

### Creating a custom crypto plugin

`createCryptoPlugin` wraps your HMAC and random-bytes implementations into a `CryptoPlugin` that any otplib package accepts.

```typescript
import { createCryptoPlugin } from "@otplib/core";

const myCrypto = createCryptoPlugin({
  name: "my-crypto",
  hmac: async (algorithm, key, data) => {
    // Return Uint8Array — async and sync returns are both accepted
  },
  randomBytes: (length) => {
    // Return a cryptographically secure Uint8Array of the requested length
  },
});
```

### Creating a custom Base32 plugin

`createBase32Plugin` wraps encode/decode functions into a `Base32Plugin`. Use this to bypass Base32 entirely or to integrate an alternative encoding library.

```typescript
import { createBase32Plugin, stringToBytes, bytesToString } from "@otplib/core";

// Example: UTF-8 passthrough (no Base32 encoding)
const plaintextPlugin = createBase32Plugin({
  name: "plaintext",
  encode: bytesToString,
  decode: stringToBytes,
});
```

### Converting secret formats

`stringToBytes` and `bytesToString` convert between UTF-8 strings and `Uint8Array`. Use `stringToBytes` when you have a raw passphrase rather than a Base32-encoded secret.

```typescript
import { stringToBytes, bytesToString } from "@otplib/core";

// Raw passphrase → Uint8Array for use as secret bytes
const secretBytes = stringToBytes("my-raw-passphrase");

// Uint8Array → string (UTF-8 decode)
const str = bytesToString(secretBytes);
```

`normalizeSecret` handles the common case of accepting either a Base32 string or a `Uint8Array` and returning bytes, given a Base32 plugin.

```typescript
import { normalizeSecret } from "@otplib/core";

const bytes = normalizeSecret("JBSWY3DPEHPK3PXP", base32Plugin);
// or pass Uint8Array directly — returned unchanged
const bytes2 = normalizeSecret(existingUint8Array);
```

### Generating a secret with explicit plugins

When using `@otplib/core` directly (rather than the main `otplib` bundle), you must supply the crypto and Base32 plugins explicitly.

```typescript
import { generateSecret } from "@otplib/core";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const secret = generateSecret({
  crypto: new NodeCryptoPlugin(),
  base32: new ScureBase32Plugin(),
  length: 20, // 160 bits — RFC 4226 recommendation
});
```

## Documentation

Full API reference and usage guides at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [Plugins Guide](https://otplib.yeojz.dev/guide/plugins)
- [API Reference](https://otplib.yeojz.dev/api/)

## Related Packages

- `@otplib/hotp` - HOTP implementation (RFC 4226)
- `@otplib/totp` - TOTP implementation (RFC 6238)
- `@otplib/plugin-crypto-node` - Node.js crypto plugin
- `@otplib/plugin-crypto-web` - Web Crypto API plugin
- `@otplib/plugin-crypto-noble` - Noble hashes crypto plugin
- `@otplib/plugin-base32-scure` - Base32 plugin using @scure/base

## License

[MIT](./LICENSE)
