# Crypto & Base32 Plugins

otplib uses a plugin architecture for cryptographic operations and Base32 encoding. This design allows you to choose the best implementation for your runtime environment.

## Quick Reference

| Plugin                        | Environment   | Synchronous HMAC | Bundle Impact |
| ----------------------------- | ------------- | ---------------- | ------------- |
| `@otplib/plugin-crypto-node`  | Node.js only  | Yes              | None (native) |
| `@otplib/plugin-crypto-web`   | Browser, Edge | No               | None (native) |
| `@otplib/plugin-crypto-noble` | Universal     | Yes              | ~15KB         |
| `@otplib/plugin-base32-scure` | Universal     | N/A              | ~3KB          |

## Choosing a Crypto Plugin

::: info Other Runtimes
This section focuses on package selection. for specific setup instructions for **Deno** (using `npm:` specifiers) or **Bun**, please refer to the [Runtime Compatibility](./runtime-compatibility) guide.
:::

### Node.js Applications

```typescript
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
const crypto = new NodeCryptoPlugin();
```

**Best for:** Server-side applications, CLI tools, scripts

### Browser Applications

```typescript
import { WebCryptoPlugin } from "@otplib/plugin-crypto-web";
const crypto = new WebCryptoPlugin();
```

**Best for:** React, Vue, Angular, vanilla JS in browsers

### Universal / Cross-Platform

```typescript
import { NobleCryptoPlugin } from "otplib";
const crypto = new NobleCryptoPlugin();
```

**Best for:** Isomorphic apps, edge runtimes, environments without native crypto

### Decision Tree

```
Is your app Node.js only?
├── Yes → Use plugin-crypto-node (fastest, no dependencies)
└── No
    ├── Browser/Edge runtime with Web Crypto API?
    │   └── Yes → Use plugin-crypto-web (native, no dependencies)
    └── Need universal support or synchronous operations?
        └── Use plugin-crypto-noble (pure JS, works everywhere)
```

## Crypto Plugins

### @otplib/plugin-crypto-node

::: info Included Plugins
The `@otplib/plugin-crypto-noble` and `@otplib/plugin-base32-scure` plugins are **included by default** in the main `otplib` package and can be imported directly. Other plugins (like `node` and `web`) must be installed separately.
:::

Node.js native crypto module adapter.

```typescript
import { generate } from "otplib";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";

const token = await generate({
  secret,
  crypto: new NodeCryptoPlugin(),
});
```

**Features:**

- Uses Node.js built-in `crypto` module
- Supports synchronous HMAC via `hmacSync()`
- Zero external dependencies
- Maximum performance on Node.js

[Full documentation →](/api/@otplib/plugin-crypto-node/)

### @otplib/plugin-crypto-web

Web Crypto API adapter for browsers and edge runtimes.

```typescript
import { generate } from "otplib";
import { WebCryptoPlugin } from "@otplib/plugin-crypto-web";

const token = await generate({
  secret,
  crypto: new WebCryptoPlugin(),
});
```

**Features:**

- Uses browser's native Web Crypto API
- Works in Cloudflare Workers, Vercel Edge, Deno
- Zero external dependencies
- Async-only (Web Crypto limitation)

[Full documentation →](/api/@otplib/plugin-crypto-web/)

### @otplib/plugin-crypto-noble

Pure JavaScript crypto using [@noble/hashes](https://github.com/paulmillr/noble-hashes).

```typescript
import { generate, NobleCryptoPlugin } from "otplib";

const token = await generate({
  secret,
  crypto: new NobleCryptoPlugin(),
});
```

**Features:**

- Works in any JavaScript environment
- Audited cryptographic library
- Supports both synchronous and async HMAC
- Cross-platform (Node.js, browsers, edge)

[Full documentation →](/api/@otplib/plugin-crypto-noble/)

## Base32 Plugin

### @otplib/plugin-base32-scure

Base32 encoding/decoding using [@scure/base](https://github.com/paulmillr/scure-base).

```typescript
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const base32 = new ScureBase32Plugin();

// Encoding
const encoded = base32.encode(new Uint8Array([1, 2, 3, 4, 5]));
// 'AEBAGBA='

// Decoding
const decoded = base32.decode("JBSWY3DPEHPK3PXP");
// Uint8Array
```

**Features:**

- RFC 4648 compliant
- Handles padding automatically
- Works in all environments
- Audited implementation

[Full documentation →](/api/@otplib/plugin-base32-scure/)

### @otplib/plugin-base32-bypass

::: warning Security Notice
This plugin bypasses Base32 encoding/decoding. Secrets provided through this plugin are treated as non-Base32 inputs for the lifetime of the instance.
:::

Bypass plugins allow working with raw string secrets or custom transformations without Base32 encoding.

Note: URI generation still expects Base32 secrets, so otpauth URIs continue to require Base32-encoded values.

#### String Bypass

`stringBypass` is a singleton plugin for UTF-8 string secrets that should be converted directly to bytes.

```typescript
import { generate } from "otplib";
import { stringBypass } from "@otplib/plugin-base32-bypass";

const token = await generate({
  secret: "my-plain-text-secret",
  base32: stringBypass,
});
```

[Full documentation →](/api/@otplib/plugin-base32-bypass/)

## Creating Custom Plugins

If you need a custom crypto or Base32 implementation, use the `createCryptoPlugin` and `createBase32Plugin` helpers from `@otplib/core`. Keep the implementation minimal and focus only on the required methods.

### Custom Crypto (Skeleton)

```typescript
import { createCryptoPlugin } from "@otplib/core";

const customCrypto = createCryptoPlugin({
  name: "custom",
  hmac: async (algorithm, key, data) => {
    // your HMAC implementation here
    return new Uint8Array();
  },
  randomBytes: (length) => {
    // your random bytes implementation here
    return new Uint8Array(length);
  },
  constantTimeEqual: (a, b) => {
    // your constant time implementation here
    return true;
  },
});
```

### Custom Base32 (Skeleton)

```typescript
import { createBase32Plugin } from "@otplib/core";

const customBase32 = createBase32Plugin({
  name: "custom-base32",
  encode: (data) => {
    // your Base32 encode implementation here
    return "";
  },
  decode: (str) => {
    // your Base32 decode implementation here
    return new Uint8Array();
  },
});
```

For full API details, see the core documentation.

## License

MIT
