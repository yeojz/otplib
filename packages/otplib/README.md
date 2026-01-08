# otplib

> The One-Time Password (OTP) library

TypeScript-first implementation of HOTP/TOTP with automatic crypto backend detection for optimal performance across Node.js, browsers, and edge environments.

## Breaking Changes (v13)

> [!IMPORTANT]  
> v13.0.0 is a complete rewrite with breaking changes:
>
> - **New**
>   - **Security-audited plugins** — Default crypto uses `@noble/hashes` and `@scure/base`, both independently audited
>   - **Cross-platform defaults** — Works out-of-the-box in Node.js, Bun, Deno, and browsers
>   - **Full type safety** — Comprehensive TypeScript types with strict mode from the ground up
>   - **Async-first API** — All operations are async by default; sync variants available for compatible plugins
> - **Removed**
>   - **Separate authenticator package** — TOTP now covers all authenticator functionality
>   - **Outdated plugins** — Legacy crypto adapters removed in favor of modern, audited alternatives
>
> See [Migration Guide](https://otplib.yeojz.dev/guide/migrating-v12-to-v13) for details.

## Features

- **Zero Configuration** - Works out of the box with sensible defaults
- **RFC Compliant** - RFC 6238 (TOTP) and RFC 4226 (HOTP)
- **TypeScript-First** - Full type definitions
- **Google Authenticator Compatible** - Full otpauth:// URI support

## Installation

```bash
npm install otplib
pnpm add otplib
yarn add otplib
```

## Quick Start

### Functional API (Recommended)

```typescript
import { generateSecret, generate, verify, generateURI } from "otplib";

// Generate a secret
const secret = generateSecret();

// Generate a TOTP token
const token = await generate({ secret });

// Verify a token
const isValid = await verify({ secret, token });

// Generate QR code URI for authenticator apps
const uri = generateURI({
  issuer: "MyService",
  label: "user@example.com",
  secret,
});
```

### Class API

```typescript
import { OTP } from "otplib";

// Create OTP instance (defaults to TOTP)
const otp = new OTP();

// Generate a secret
const secret = otp.generateSecret();

// Generate a TOTP token
const token = await otp.generate({ secret });

// Verify a token
const isValid = await otp.verify({ secret, token });

// Generate QR code URI for authenticator apps
const uri = otp.generateURI({
  issuer: "MyService",
  label: "user@example.com",
  secret,
});
```

## Documentation

Full documentation available at [here](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [Runtime Compatibility](https://otplib.yeojz.dev/guide/runtime-compatibility)
- [Security Considerations](https://otplib.yeojz.dev/guide/security)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE) © 2026 Gerald Yeo
