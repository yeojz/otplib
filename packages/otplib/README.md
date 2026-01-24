# otplib

TypeScript-first library for HOTP and TOTP / Authenticator with multi-runtime (Node, Bun, Deno, Browser) support via plugins.

A web based demo is available at [https://otplib.yeojz.dev](https://otplib.yeojz.dev).

## Features

- **Zero Configuration** - Works out of the box with sensible defaults
- **RFC Compliant** - RFC 6238 (TOTP) and RFC 4226 (HOTP)
- **TypeScript-First** - Full type definitions
- **Google Authenticator Compatible** - Full otpauth:// URI support
- **Plugin Interface** - Flexible plugin system for customising your cryptographic and base32 requirements (if you want to deviate from the defaults)
- **Cross-platform** - Tested against Node.js, Bun, Deno, and browsers

## Breaking Changes (v13)

> [!IMPORTANT]  
> v13 is a complete rewrite with breaking changes:
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
> See [Migration Guide](https://otplib.yeojz.dev/guide/v12-adapter) for details.

## Installation

```bash
# Node
npm install otplib
pnpm add otplib
yarn add otplib
```

```bash
# Other runtimes
bun add otplib
deno install npm:otplib
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

## Notes

### Secret Format

By default, otplib expects secrets to be in **Base32** format. While the core HOTP (RFC 4226) and TOTP (RFC 6238) specifications work with raw binary data and don't mandate Base32 encoding, Base32 is the standard format used by authenticator applications and QR code URIs for compatibility.

```typescript
// Base32 secret (standard format for authenticator compatibility)
const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY";
```

However, if you need to use secrets in other formats, you can either use the `plugin-base32-alt` plugin for raw strings or pass a byte array (using `stringToBytes` helper) for binary data.

For more details and examples, see the [Secret Handling Guide](https://otplib.yeojz.dev/guide/secret-handling.md) and related plugin documentation in the guides directory.

## Documentation

Refer to the [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started), or check out the other sections in the guide:

- [Advanced Usage](https://otplib.yeojz.dev/guide/advanced-usage)
- [Runtime Compatibility](https://otplib.yeojz.dev/guide/runtime-compatibility)
- [Security Considerations](https://otplib.yeojz.dev/guide/security)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE) © 2026 Gerald Yeo
