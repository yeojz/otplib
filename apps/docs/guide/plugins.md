# Crypto & Base32 Plugins

otplib uses a plugin architecture for cryptographic operations and Base32 encoding. This design allows you to choose the best implementation for your runtime environment.

## Quick Reference

| Plugin                        | Environment   | Synchronous HMAC | Bundle Impact |
| ----------------------------- | ------------- | ---------------- | ------------- |
| `@otplib/plugin-crypto-node`  | Node.js only  | Yes              | None (native) |
| `@otplib/plugin-crypto-web`   | Browser, Edge | No               | None (native) |
| `@otplib/plugin-crypto-noble` | Universal     | Yes              | ~15KB         |
| `@otplib/plugin-base32-scure` | Universal     | N/A              | ~3KB          |
| `@otplib/plugin-base32-alt`   | Universal     | N/A              | ~1KB          |

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
const decoded = base32.decode("GEZDGNBVGY3TQOJQGEZDGNBVGY");
// Uint8Array
```

**Features:**

- RFC 4648 compliant
- Handles padding automatically
- Works in all environments
- Audited implementation

[Full documentation →](/api/@otplib/plugin-base32-scure/)

### @otplib/plugin-base32-alt

::: warning Note
This plugin bypasses Base32 encoding/decoding. Secrets provided through this plugin are treated as non-Base32 inputs for the lifetime of the instance.
:::

Alternative encoding plugins allow working with raw string secrets or custom transformations without Base32 encoding.

Note: URI generation still expects Base32 secrets, so otpauth URIs continue to require Base32-encoded values.

#### String Bypass

`bypassAsString` is a singleton plugin for UTF-8 string secrets that should be converted directly to bytes.

```typescript
import { generate } from "otplib";
import { bypassAsString } from "@otplib/plugin-base32-alt";

const token = await generate({
  secret: "my-plain-text-secret",
  base32: bypassAsString,
});
```

#### Hex/Base16 Bypass

`bypassAsHex` is a singleton plugin for hex-encoded string secrets. Use this when your secret is stored or transmitted as a hexadecimal string.

```typescript
import { generate } from "otplib";
import { bypassAsHex } from "@otplib/plugin-base32-alt";

const token = await generate({
  secret: "48656c6c6f", // "Hello" in hex
  base32: bypassAsHex,
});
```

The hex bypass:

- Accepts both lowercase (`abcdef`) and uppercase (`ABCDEF`) hex characters
- Validates input: throws `Base32DecodeError` for odd-length strings or invalid characters
- Produces lowercase hex output when encoding

Note: `bypassAsBase16` is available as an alias for `bypassAsHex`.

#### Base64 Bypass

`bypassAsBase64` is a singleton plugin for base64-encoded string secrets. Use this when your secret is stored or transmitted as a base64 string.

```typescript
import { generate } from "otplib";
import { bypassAsBase64 } from "@otplib/plugin-base32-alt";

const token = await generate({
  secret: "SGVsbG8=", // "Hello" in base64
  base32: bypassAsBase64,
});
```

#### Custom Transformations

For other formats, use `createBase32Plugin` to build custom bypass plugins:

```typescript
import { createBase32Plugin } from "@otplib/plugin-base32-alt";

// Example: URL-safe base64
const urlSafeBase64Bypass = createBase32Plugin({
  name: "url-safe-base64",
  encode: (data) =>
    btoa(String.fromCharCode(...data))
      .replace(/\+/g, "-")
      .replace(/\//g, "_"),
  decode: (str) => {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  },
});
```

#### API Exports

| Export                      | Description                                      |
| --------------------------- | ------------------------------------------------ |
| `bypassAsString`            | Frozen plugin for UTF-8 string ↔ bytes           |
| `bypassAsHex`               | Frozen plugin for hex string ↔ bytes             |
| `bypassAsBase16`            | Alias for `bypassAsHex`                          |
| `bypassAsBase64`            | Frozen plugin for base64 string ↔ bytes          |
| `createBase32Plugin`        | Factory for custom bypass plugins                |
| `CreateBase32PluginOptions` | TypeScript type for `createBase32Plugin` options |

[Full documentation →](/api/@otplib/plugin-base32-alt/)

## Creating Custom Plugins

If you need a custom crypto or Base32 implementation, use the `createCryptoPlugin` and `createBase32Plugin` helpers from `@otplib/core`.

### Custom Crypto

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

### Custom Base32

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

### Class Extension

For more advanced behavior (stateful configuration, shared helpers, or multiple methods), you can extend a class that implements the plugin interface instead of using the factories. This is useful when you need lifecycle setup or richer internal structure.

```typescript
import type { CryptoPlugin } from "@otplib/core";

class CustomCryptoPlugin implements CryptoPlugin {
  name = "custom";

  hmac(algorithm, key, data) {
    // your HMAC implementation here
    return new Uint8Array();
  }

  randomBytes(length) {
    // your random bytes implementation here
    return new Uint8Array(length);
  }

  constantTimeEqual(a, b) {
    // your constant time implementation here
    return true;
  }
}
```

```typescript
import type { Base32Plugin } from "@otplib/core";

class CustomBase32Plugin implements Base32Plugin {
  name = "custom-base32";

  encode(data) {
    // your Base32 encode implementation here
    return "";
  }

  decode(str) {
    // your Base32 decode implementation here
    return new Uint8Array();
  }
}
```

For full API details, see the core documentation.

## License

MIT
