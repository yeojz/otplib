# @otplib/plugin-base32-rfc

Dependency-free RFC 4648 Base32 encoding/decoding plugin for otplib.

## Installation

```bash
npm install @otplib/plugin-base32-rfc
pnpm add @otplib/plugin-base32-rfc
yarn add @otplib/plugin-base32-rfc
```

## Overview

This plugin implements the standard RFC 4648 Base32 alphabet (`A-Z2-7`) used by authenticator apps, with no dependencies.

It accepts and rejects the same inputs as `@otplib/plugin-base32-scure`, with the same error messages, so the two plugins are interchangeable. Because it has no ESM-only dependencies, its CommonJS build loads with `require()` on any Node.js version.

## Usage

### Basic Usage

```typescript
import { generateSecret, generate } from "otplib";
import { base32 } from "@otplib/plugin-base32-rfc";
import { crypto } from "@otplib/plugin-crypto-node";

// Generate a secret
const secret = generateSecret({ crypto, base32 });

// Generate a token
const token = await generate({
  secret,
  crypto,
  base32,
});
```

### Encoding and Decoding

```typescript
import { base32 } from "@otplib/plugin-base32-rfc";

// Encode binary data to Base32
const data = new Uint8Array([1, 2, 3, 4, 5]);
const encoded = base32.encode(data, { padding: true });
// Output: "AEBAGBAF"

// Decode Base32 string to binary
const decoded = base32.decode("AEBAGBAF");
// Output: Uint8Array [1, 2, 3, 4, 5]
```

Decoding accepts lowercase input and missing padding, and rejects:

- letters outside `A-Z2-7` (including spaces and hyphens)
- impossible lengths, such as a single trailing letter
- non-zero leftover bits in the last letter
- padding that covers a whole 8-letter block

### CommonJS without require() of ES modules

Where the runtime cannot `require()` ES modules (Node.js older than 20.19 / 22.12, or a CommonJS loader hook that rejects them), combine packages with no ESM-only dependencies:

```javascript
const { generateSecret } = require("@otplib/core");
const { generate, verify } = require("@otplib/totp");
const { crypto } = require("@otplib/plugin-crypto-node");
const { base32 } = require("@otplib/plugin-base32-rfc");

const secret = generateSecret({ crypto, base32 });
const token = await generate({ secret, crypto, base32 });
const result = await verify({ secret, token, crypto, base32 });
```

## Platform Support

Works in all environments, from both ESM and CommonJS:

- Node.js
- Browsers (Chrome, Firefox, Safari, Edge)
- Edge runtimes (Cloudflare Workers, Vercel Edge)
- Deno
- Bun

## Related Packages

- `@otplib/plugin-base32-scure` - Base32 plugin using `@scure/base` (the `otplib` default)
- `@otplib/core` - Core types and interfaces
- `@otplib/plugin-crypto-node` - Node.js crypto plugin
- `@otplib/plugin-crypto-web` - Web Crypto API plugin

## Documentation

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE)
