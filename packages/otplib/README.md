# otplib

TypeScript-first library for HOTP and TOTP / Authenticator with multi-runtime (Node, Bun, Deno, Browser) support via plugins.

> [!TIP]
>
> A web based demo is available at [https://otplib.yeojz.dev](https://otplib.yeojz.dev).
>
> You can scan the TOTP / HOTP QR Code samples with your chosen authenticator app to test.

## Features

- **Zero Configuration** - Works out of the box with sensible defaults
- **RFC Compliant** - RFC 6238 (TOTP) and RFC 4226 (HOTP) + Google Authenticator Compatible
- **TypeScript-First** - Full type definitions
- **Plugin Interface** - Flexible plugin system for customising your cryptographic and base32 requirements (if you want to deviate from the defaults)
- **Cross-platform** - Tested against Node.js, Bun, Deno, and browsers
- **Security-audited plugins** — Default crypto uses `@noble/hashes` and `@scure/base`, both independently audited
- **Async-first API** — All operations are async by default; sync variants available for compatible plugins

> [!IMPORTANT]
>
> v13 is a complete rewrite with breaking changes. For example:
>
> - **(Removed) Separate authenticator package** — TOTP now covers all authenticator functionality with default plugins
> - **(Removed) Outdated plugins** — Legacy crypto adapters removed in favor of modern, audited alternatives
>
> See [Migration Guide](https://otplib.yeojz.dev/guide/v12-adapter.html) for details.

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

### CDN / Script Tag

A self-contained IIFE build is available for use directly in browsers via a `<script>` tag:

```html
<!-- unpkg -->
<script src="https://unpkg.com/otplib/dist/index.global.js"></script>

<!-- or jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/otplib/dist/index.global.js"></script>

<script>
  const { generateSecret, generate, verify } = otplib;

  const secret = generateSecret();
  generate({ secret }).then((token) => console.log("Token:", token));
</script>
```

The IIFE build bundles all dependencies (including crypto and base32 plugins) into a single file and exposes everything under the `otplib` global.

## Quick Start

### Functional API (Recommended)

```typescript
import { generateSecret, generate, verify, generateURI } from "otplib";

// Generate a secret
const secret = generateSecret();

// Generate a TOTP token
const token = await generate({ secret });

// Verify a token — returns VerifyResult, not a boolean
const result = await verify({ secret, token });
console.log(result.valid); // true or false

// Generate QR code URI for authenticator apps
const uri = generateURI({
  issuer: "MyService",
  label: "user@example.com",
  secret,
});
```

Sync variants (`generateSync`, `verifySync`) are available when using a sync-compatible crypto plugin such as `@otplib/plugin-crypto-node` or `@otplib/plugin-crypto-noble`.

### Class API

```typescript
import { OTP } from "otplib";

// Create OTP instance (defaults to TOTP strategy)
const otp = new OTP();

// Generate a secret
const secret = otp.generateSecret();

// Generate a TOTP token
const token = await otp.generate({ secret });

// Verify a token — returns VerifyResult, not a boolean
const result = await otp.verify({ secret, token });
console.log(result.valid); // true or false

// Generate QR code URI for authenticator apps
const uri = otp.generateURI({
  issuer: "MyService",
  label: "user@example.com",
  secret,
});
```

The class also exposes `generateSync` and `verifySync` for use with sync-compatible crypto plugins.

#### HOTP (counter-based) with the Class API

Pass `strategy: 'hotp'` to switch to counter-based OTP. A `counter` value is required for generation and verification.

```typescript
import { OTP } from "otplib";

const otp = new OTP({ strategy: "hotp" });
const secret = otp.generateSecret();

const token = await otp.generate({ secret, counter: 0 });
const result = await otp.verify({ secret, token, counter: 0 });
console.log(result.valid); // true or false
```

## Compatibility with Authenticator Apps

### Secret Format

By default, otplib expects secrets to be in **Base32** format. This is the ensure broader compatiblity as it the standard format used by authenticator applications and QR code URIs.

While the core HOTP (RFC 4226) and TOTP (RFC 6238) specifications work with raw binary data and don't mandate Base32 encoding, Base32

```typescript
// Base32 secret (standard format for authenticator compatibility)
const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY";
```

However, if you need to use secrets in other formats, you can either use the `plugin-base32-alt` plugin for raw strings or pass a byte array (using `stringToBytes` helper) for binary data.

For more details and examples, see the [Secret Handling Guide](https://otplib.yeojz.dev/guide/secret-handling) and related plugin documentation in the guides directory.

### Configuration Defaults

RFC 4226 (HOTP) and RFC 6238 (TOTP) define flexible algorithms that allow different hash functions, digit lengths, and time steps. However, most authenticator apps (Google Authenticator, Authy, Microsoft Authenticator, 1Password, etc.) and services offering 2 factor authentication use the following defaults:

| Parameter   | Value         |
| ----------- | ------------- |
| `algorithm` | `sha1`        |
| `digits`    | `6`           |
| `period`    | `30`          |
| `secret`    | Base32 string |

If you are deviating from these values, do validate that it is supported by the target application.

If you need to provision an authenticator app via QR code, use [`@otplib/uri`](https://www.npmjs.com/package/@otplib/uri) to generate an `otpauth://totp/` URI.

## Documentation

Refer to the [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started), or check out the other sections in the guide:

- [Advanced Usage](https://otplib.yeojz.dev/guide/advanced-usage)
- [Runtime Compatibility](https://otplib.yeojz.dev/guide/runtime-compatibility)
- [Security Considerations](https://otplib.yeojz.dev/guide/security)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE)
