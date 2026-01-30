# @otplib/plugin-crypto-web

Web Crypto API plugin for otplib, compatible with browsers and edge runtimes.

## Installation

```bash
npm install @otplib/plugin-crypto-web
pnpm add @otplib/plugin-crypto-web
yarn add @otplib/plugin-crypto-web
```

## Overview

This plugin provides HMAC and random byte generation using the Web Crypto API. It supports all hash algorithms available in modern browsers:

- `SHA-1`
- `SHA-256`
- `SHA-512`

## Usage

### Basic Usage

```typescript
import { generateSecret, generate } from "otplib";
import { crypto } from "@otplib/plugin-crypto-web";
import { base32 } from "@otplib/plugin-base32-scure";

// Generate a secret
const secret = await generateSecret({ crypto, base32 });

// Generate a token
const token = await generate({
  secret,
  crypto,
  base32,
});
```

### With Custom Algorithm

```typescript
import { generate } from "otplib";
import { crypto } from "@otplib/plugin-crypto-web";
import { base32 } from "@otplib/plugin-base32-scure";

const token = await generate({
  secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY",
  algorithm: "sha256",
  crypto,
  base32,
});
```

### Asynchronous Operations

The Web Crypto API only supports asynchronous operations:

```typescript
import { crypto } from "@otplib/plugin-crypto-web";

// Async HMAC (required by Web Crypto API)
const digest = await crypto.hmac("SHA-1", key, data);

// Async random bytes
const bytes = await crypto.randomBytes(20);
```

## Edge Runtime Support

Should also work in runtimes which implements Web Crypto API:

```typescript
// Cloudflare Worker example
import { crypto } from "@otplib/plugin-crypto-web";

export default {
  async fetch(request) {
    // Use crypto for OTP operations
  },
};
```

## When to Use

Use this plugin when:

- Running in browsers (eg: Chrome, Firefox, Safari, Edge)
- Using edge runtimes (eg: Cloudflare Workers, Vercel Edge Functions)
- Building web applications with React, Vue, etc.
- Need cross-platform crypto support
- Want modern browser-native crypto (no external dependencies)

## Performance

- All operations return Promises (asynchronous only)
- Uses native browser crypto implementations
- Uses OS-level crypto primitives

## Limitations

- Only supports asynchronous operations (no sync HMAC)
- Not available in Node.js (use `@otplib/plugin-crypto-node` instead)
- Requires modern browser with Web Crypto API support

## Documentation

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE)
