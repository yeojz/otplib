# @otplib/plugin-crypto-noble

Pure JavaScript crypto plugin for otplib using [@noble/hashes](https://github.com/paulmillr/noble-hashes).

## Installation

```bash
npm install @otplib/plugin-crypto-noble
pnpm add @otplib/plugin-crypto-noble
yarn add @otplib/plugin-crypto-noble
```

## Overview

This plugin provides HMAC and random byte generation using the `@noble/hashes` library - a zero-dependency, audited cryptographic implementation in pure JavaScript. It supports all standard hash algorithms:

- `sha1`
- `sha256`
- `sha512`

## Usage

### Basic Usage

```typescript
import { generateSecret, generate } from "otplib";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();

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
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();

const token = await generate({
  secret: "JBSWY3DPEHPK3PXP",
  algorithm: "sha256",
  crypto,
  base32,
});
```

### Synchronous Operations

The noble crypto plugin supports both synchronous and asynchronous HMAC operations:

```typescript
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";

const crypto = new NobleCryptoPlugin();

// Sync HMAC (useful for high-volume operations)
const digest = crypto.hmacSync("sha1", key, data);

// Async HMAC (consistent API with web crypto)
const digest = await crypto.hmac("sha1", key, data);
```

## When to Use

Use this plugin when:

- **Cross-platform compatibility** is required (works in Node.js, browsers, and edge runtimes)
- Running in **edge runtimes** that don't support Web Crypto API fully
- Need a **pure JavaScript** implementation without native dependencies
- Want **audited crypto** from a well-maintained library
- Building **isomorphic applications** that run on both server and client
- Need **synchronous HMAC** operations in environments without Node.js crypto

## Security Considerations

- Uses [@noble/hashes](https://github.com/paulmillr/noble-hashes) which is audited and widely used
- Pure JavaScript implementation - no WebAssembly or native bindings
- Cryptographically secure random bytes using the platform's CSPRNG

## Comparison with Other Plugins

| Feature      | plugin-crypto-noble | plugin-crypto-node | plugin-crypto-web |
| ------------ | ------------------- | ------------------ | ----------------- |
| Node.js      | Yes                 | Yes                | No                |
| Browser      | Yes                 | No                 | Yes               |
| Edge Runtime | Yes                 | No                 | Yes               |
| Sync HMAC    | Yes                 | Yes                | No                |
| Pure JS      | Yes                 | No                 | No                |
| Dependencies | @noble/hashes       | None               | None              |

## Bundle Size

The `@noble/hashes` library adds approximately 15KB (gzipped) to your bundle. For browser applications where bundle size is critical, consider using `@otplib/plugin-crypto-web` instead.

## Documentation

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE) © 2026 Gerald Yeo
