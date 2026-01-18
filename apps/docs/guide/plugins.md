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

#### Custom Bypass Logic

`createBase32Plugin` can define custom encode/decode logic for formats that are not Base32.

```typescript
import { generate } from "otplib";
import { createBase32Plugin } from "@otplib/plugin-base32-bypass";

const customBypass = createBase32Plugin({
  encode: (data) => {
    return "encoded_string";
  },
  decode: (str) => {
    return new Uint8Array([1, 2, 3]);
  },
});

const token = await generate({
  secret: "custom-secret-format",
  base32: customBypass,
});
```

**Example: Hex-encoded secrets**

```typescript
import { generate } from "otplib";
import { createBase32Plugin } from "@otplib/plugin-base32-bypass";
import { hex } from "@scure/base";

const hexBypass = createBase32Plugin({
  encode: hex.encode,
  decode: hex.decode,
});

const token = await generate({
  secret: "4d79736563726574", // "Mysecret" in hex
  base32: hexBypass,
});
```

[Full documentation →](/api/@otplib/plugin-base32-bypass/)

## Creating Custom Plugins

### Plugin Architecture

otplib uses a plugin architecture for both cryptographic operations and Base32 encoding:

#### Crypto Plugin Interface

```typescript
import type { CryptoPlugin, HashAlgorithm } from "@otplib/core";

type CryptoPlugin = {
  name: string;
  hmac(
    algorithm: HashAlgorithm,
    key: Uint8Array,
    data: Uint8Array,
  ): Uint8Array | Promise<Uint8Array>;
  randomBytes(length: number): Uint8Array;
  constantTimeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean;
};
```

#### Base32 Plugin Interface

```typescript
import type { Base32Plugin } from "@otplib/core";

type Base32Plugin = {
  name: string;
  encode(data: Uint8Array, options?: Base32EncodeOptions): string;
  decode(str: string): Uint8Array;
};

type Base32EncodeOptions = {
  padding?: boolean; // Whether to add padding characters (default: true)
};
```

### Custom Crypto

Implement a custom crypto backend for specialized environments or requirements:

```typescript
import { generate } from "otplib";
import type { CryptoPlugin, HashAlgorithm } from "@otplib/core";

// Custom crypto plugin
const customCrypto: CryptoPlugin = {
  name: "custom",
  hmac: async (algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array) => {
    // Your HMAC implementation
    // Must return a Uint8Array with the digest
    return digest;
  },
  randomBytes: (length: number) => {
    // Your cryptographically secure random byte generation
    // Must return a Uint8Array of the specified length
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  },
  constantTimeEqual: (a: string | Uint8Array, b: string | Uint8Array) => {
    const encoder = new TextEncoder();
    const aBytes = typeof a === "string" ? encoder.encode(a) : a;
    const bBytes = typeof b === "string" ? encoder.encode(b) : b;
    if (aBytes.length !== bBytes.length) {
      return false;
    }
    let diff = 0;
    for (let i = 0; i < aBytes.length; i += 1) {
      diff |= aBytes[i] ^ bBytes[i];
    }
    return diff === 0;
  },
};

// Use with otplib
const token = await generate({
  secret: "JBSWY3DPEHPK3PXP",
  crypto: customCrypto,
});
```

#### Potential Use Cases for Custom Crypto

- **Legacy Systems** - Integrate with existing crypto infrastructure
- **Compliance Requirements** - Meet specific regulatory or security requirements

#### Example: Web Crypto Backend implementation

The built-in `WebCryptoPlugin` demonstrates a custom crypto implementation:

```typescript
import type { CryptoPlugin, HashAlgorithm } from "@otplib/core";

class WebCryptoPlugin implements CryptoPlugin {
  name = "web-crypto";

  async hmac(algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    const subtle = crypto.subtle;
    const algo = { name: "HMAC", hash: `SHA-${algorithm.slice(3)}` };

    const cryptoKey = await subtle.importKey("raw", key, algo, false, ["sign"]);

    const signature = await subtle.sign(algo, cryptoKey, data);
    return new Uint8Array(signature);
  }

  randomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  constantTimeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean {
    const encoder = new TextEncoder();
    const aBytes = typeof a === "string" ? encoder.encode(a) : a;
    const bBytes = typeof b === "string" ? encoder.encode(b) : b;
    if (aBytes.length !== bBytes.length) {
      return false;
    }
    let diff = 0;
    for (let i = 0; i < aBytes.length; i += 1) {
      diff |= aBytes[i] ^ bBytes[i];
    }
    return diff === 0;
  }
}
```

### Custom Base32

Implement a custom Base32 encoder for specialized encoding requirements:

```typescript
import { generate } from "otplib";
import type { Base32Plugin } from "@otplib/core";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";

// Custom Base32 plugin
const customBase32: Base32Plugin = {
  name: "custom-base32",
  encode: (data: Uint8Array, options?: { padding?: boolean }) => {
    // Your Base32 encoding implementation
    // Must return a string
    return encodedString;
  },
  decode: (str: string) => {
    // Your Base32 decoding implementation
    // Must return a Uint8Array
    return decodedData;
  },
};

// Use with otplib
const token = await generate({
  secret: "JBSWY3DPEHPK3PXP",
  crypto: new NodeCryptoPlugin(),
  base32: customBase32,
});
```

#### Potential Use Cases for Custom Base32

- **Custom Alphabets** - Use different character sets for compatibility
- **Legacy Formats** - Integrate with existing Base32 formats
- **Performance Optimization** - Optimize for specific use cases
- **Specialized Requirements** - Meet specific encoding/decoding needs

#### Example: Alternative Alphabet

```typescript
import type { Base32Plugin } from "@otplib/core";

class CustomBase32Plugin implements Base32Plugin {
  name = "custom-alphabet";

  private readonly alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; // Standard RFC 4648
  // Or use a custom alphabet like Crockford's Base32
  // private readonly alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

  encode(data: Uint8Array, options?: { padding?: boolean }): string {
    // Your encoding logic
    return encoded;
  }

  decode(str: string): Uint8Array {
    // Your decoding logic
    return decoded;
  }
}
```

## License

MIT
