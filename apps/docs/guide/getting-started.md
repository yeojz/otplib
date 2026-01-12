# Getting Started with otplib

A guide to using `otplib` in your projects.

## Installation

::: info Runtime Compatibility
otplib works across Node.js, Bun, Deno, and browsers. See [Runtime Compatibility](./runtime-compatibility) for detailed information on platform-specific setup and plugin recommendations.
:::

### Install the Main Package (Recommended)

The main `otplib` package works across Node.js, browsers, and edge environments out of the box.

```bash
npm install otplib
```

### Install Individual Packages

For smaller bundle sizes or platform-specific optimizations, you can install individual modules:

```bash
# Core functionality
npm install @otplib/core @otplib/totp

# For Node.js
npm install @otplib/plugin-crypto-node

# For browsers
npm install @otplib/plugin-crypto-web

# For Base32 encoding
npm install @otplib/plugin-base32-scure

# For Error types and Core utilities
npm install @otplib/core
```

## Quick Start

### Functional API (Recommended)

For tree-shaking support or purely functional programming:

#### TOTP (Time-Based OTP)

```typescript
import { generateSecret, generate, verify } from "otplib";

// Generate a secret
const secret = generateSecret();
console.log("Secret:", secret); // Base32-encoded secret

// Generate current token
const token = await generate({ secret });
console.log("Token:", token); // e.g., "123456"

// Verify a token
const result = await verify({ secret, token });
console.log("Valid:", result.valid); // true
// result.epoch is available here for TOTP
```

#### HOTP (HMAC-Based OTP)

```typescript
import { generate, verify } from "otplib";

const secret = "JBSWY3DPEHPK3PXP";

// Generate token for counter 0
const token = await generate({ secret, strategy: "hotp", counter: 0 });
console.log("Token at counter 0:", token);

// Verify token
const result = await verify({ secret, token, strategy: "hotp", counter: 0 });
console.log("Valid:", result.valid); // true
```

### Class API

The `OTP` class provides a unified interface for all OTP strategies:

```typescript
import { OTP } from "otplib";

// Create OTP instance with TOTP strategy (default)
const otp = new OTP({ strategy: "totp" });

// Generate a secret
const secret = otp.generateSecret();
console.log("Secret:", secret); // Base32-encoded secret

// Generate current token
const token = await otp.generate({ secret });
console.log("Token:", token); // e.g., "123456"

// Verify a token
const result = await otp.verify({ secret, token });
console.log("Valid:", result.valid); // true
```

### Synchronous (Non-Async) API

::: warning Web Crypto Incompatibility
The synchronous API is **not compatible** with `@otplib/plugin-crypto-web` because the Web Crypto API supports only async operations. It works with `@otplib/plugin-crypto-node` and `@otplib/plugin-crypto-noble`.
:::

If you are using a synchronous compatible plugin, you can use the synchronous methods:

```typescript
import { OTP } from "otplib";

const otp = new OTP({ strategy: "totp" });

// Generate token synchronously
const token = otp.generateSync({ secret });
console.log("Token:", token);

// Verify token synchronously
const result = otp.verifySync({ secret, token });
console.log("Valid:", result.valid);
```

## Configuration Options

### OTP Strategies

- **`totp`**: Time-based OTP (default) - Uses timestamp to generate tokens
- **`hotp`**: HMAC-based OTP - Uses a counter to generate tokens

::: info Note on Google Authenticator vs RFC4648 (TOTP)

**Google Authenticator** requires specific settings for compatibility:

- Algorithm: `sha1` (default)
- Digits: `6` (default)
- Period: `30` seconds (default)
- Secret: Base32 encoded, **unpadded**

**RFC 4648** specifies that Base32 should be padded. However, Google Authenticator and many other apps expect unpadded secrets. `otplib` defaults to `padding: false` in `generateSecret` and `generateURI` to ensure compatibility out of the box.
:::

### TOTP Options

```typescript
const token = await generate({
  secret: "JBSWY3DPEHPK3PXP", // Base32-encoded secret (required)

  // Optional
  algorithm: "sha1", // 'sha1', 'sha256', or 'sha512'
  digits: 6, // 6, 7, or 8 digits
  period: 30, // Time step in seconds (default: 30)
  epoch: Date.now() / 1000, // Current Unix timestamp in seconds
});

// Verification with tolerance
const result = await verify({
  secret: "JBSWY3DPEHPK3PXP",
  token: "123456",
  epochTolerance: 30, // Accept tokens valid within ±30 seconds
});
```

### HOTP Options

```typescript
const token = await generate({
  secret: "JBSWY3DPEHPK3PXP", // Base32-encoded secret (required)
  counter: 0, // Counter value (required)

  // Optional
  algorithm: "sha1", // 'sha1', 'sha256', or 'sha512'
  digits: 6, // 6, 7, or 8 digits
});

// Verification with counter tolerance
const result = await verify({
  secret: "JBSWY3DPEHPK3PXP",
  token: "123456",
  strategy: "hotp",
  counter: 0,
  counterTolerance: 5, // Look-ahead window (check counters 0-5)
});
```

## Error Handling

otplib provides specific error types (requires `@otplib/core`):

```typescript
import { SecretTooShortError, TokenFormatError, CounterOverflowError } from "@otplib/core";

try {
  const result = await verify({ secret: "abc", token: "123456" });
} catch (error) {
  if (error instanceof SecretTooShortError) {
    console.error("Secret is too short (minimum 16 bytes)");
  } else if (error instanceof TokenFormatError) {
    console.error("Token must contain only digits");
  } else if (error instanceof CounterOverflowError) {
    console.error("Counter has exceeded maximum value");
  }
}
```

## Using QR Codes

Generate QR codes for authenticator apps:

```typescript
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode"; // npm install qrcode

async function setupTwoFactor(userEmail: string) {
  // Generate a new secret
  const secret = generateSecret();

  // Create otpauth:// URI
  const uri = generateURI({
    issuer: "MyApp",
    label: userEmail,
    secret,
  });

  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(uri);

  return {
    secret, // Store securely in database
    qrDataUrl, // Send to frontend for display
    uri, // Alternative: manual entry
  };
}
```

## Utility Functions

### Get Remaining Time

```typescript
import { getRemainingTime } from "@otplib/totp";

// Seconds until current token expires
const remaining = getRemainingTime();
console.log(`Token expires in ${remaining}s`);

// With custom parameters
const remainingCustom = getRemainingTime(
  Math.floor(Date.now() / 1000), // current time
  30, // period in seconds
  0, // t0 (initial Unix time)
);
```

## Important Notes

### Time Synchronization

TOTP depends on accurate time synchronization between client and server:

- Ensure servers use NTP for time synchronization
- Consider wider verification windows for mobile devices (which may have clock drift)
- Monitor for systematic time skew in your infrastructure

### Memory Safety

otplib handles secrets securely:

- Secrets are converted to `Uint8Array` for processing
- No string concatenation of secrets during HMAC computation
- Zero-copy operations where possible
- Secrets are not logged or exposed in error messages

## Next Steps

- [Runtime Compatibility](./runtime-compatibility) - Platform-specific setup and recommendations
- [Advanced Usage](./advanced-usage) - Security best practices and production considerations
- [Plugins](./plugins) - Custom backends and plugins
- [API Reference](../api/) - Detailed API documentation
