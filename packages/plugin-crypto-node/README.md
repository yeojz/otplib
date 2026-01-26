# @otplib/plugin-crypto-node

Node.js crypto plugin for otplib using the built-in `crypto` module.

## Installation

```bash
npm install @otplib/plugin-crypto-node
pnpm add @otplib/plugin-crypto-node
yarn add @otplib/plugin-crypto-node
```

## Overview

This plugin provides HMAC and random byte generation using Node.js's built-in `crypto` module. It supports all hash algorithms available in Node.js:

- `sha1`
- `sha256`
- `sha512`

## Usage

### Basic Usage

```typescript
import { generateSecret, generate } from "otplib";
import { crypto } from "@otplib/plugin-crypto-node";
import { base32 } from "@otplib/plugin-base32-scure";

// Generate a secret
const secret = generateSecret({ crypto, base32 });

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
import { crypto } from "@otplib/plugin-crypto-node";
import { base32 } from "@otplib/plugin-base32-scure";

const token = await generate({
  secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY",
  algorithm: "sha256",
  crypto,
  base32,
});
```

### Synchronous HMAC

The Node.js crypto plugin supports both synchronous and asynchronous HMAC operations:

```typescript
import { crypto } from "@otplib/plugin-crypto-node";

// Sync HMAC (faster, but blocks event loop)
const digest = crypto.hmacSync("sha1", key, data);

// Async HMAC (doesn't block event loop)
const digest = await crypto.hmac("sha1", key, data);
```

## When to Use

Use this plugin when:

- Running in Node.js environment
- Need maximum performance
- Want to use Node.js built-in crypto (no external dependencies)
- Need synchronous HMAC operations

## Platform Support

- Node.js (all versions)
- Not available in browsers (use `@otplib/plugin-crypto-web` instead)
- Not available in edge runtimes (use `@otplib/plugin-crypto-web` instead)

## Documentation

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE) © 2026 Gerald Yeo
