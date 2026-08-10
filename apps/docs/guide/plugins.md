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

## Class Availability

While the examples above use the convenient singleton exports (e.g., `import { crypto } ...`), the plugin classes are also available for cases where you need manual instantiation, dependency injection, or custom configuration.

| Plugin Package                | Singleton Export | Class Export        |
| ----------------------------- | ---------------- | ------------------- |
| `@otplib/plugin-crypto-node`  | `crypto`         | `NodeCryptoPlugin`  |
| `@otplib/plugin-crypto-web`   | `crypto`         | `WebCryptoPlugin`   |
| `@otplib/plugin-crypto-noble` | `crypto`         | `NobleCryptoPlugin` |
| `@otplib/plugin-base32-scure` | `base32`         | `ScureBase32Plugin` |

**Example: Manual Instantiation**

```typescript
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";

// Create your own instance
const validCrypto = new NodeCryptoPlugin();
```

## Choosing a Crypto Plugin

::: info Other Runtimes
This section focuses on package selection. For specific setup instructions for **Deno** (using `npm:` specifiers) or **Bun**, please refer to the [Runtime Compatibility](./runtime-compatibility) guide.
:::

### Node.js Applications

```typescript
import { crypto } from "@otplib/plugin-crypto-node";
```

**Best for:** Server-side applications, CLI tools, scripts

### Browser Applications

```typescript
import { crypto } from "@otplib/plugin-crypto-web";
```

**Best for:** React, Vue, Angular, vanilla JS in browsers

### Universal / Cross-Platform

```typescript
import { crypto } from "@otplib/plugin-crypto-noble";
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
import { crypto } from "@otplib/plugin-crypto-node";

const token = await generate({
  secret,
  crypto,
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
import { crypto } from "@otplib/plugin-crypto-web";

const token = await generate({
  secret,
  crypto,
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
import { generate } from "otplib";
import { crypto } from "@otplib/plugin-crypto-noble";

const token = await generate({
  secret,
  crypto,
});
```

**Features:**

- Works in any JavaScript environment
- Audited cryptographic library
- Supports both synchronous and async HMAC
- Cross-platform (Node.js, browsers, edge)

[Full documentation →](/api/@otplib/plugin-crypto-noble/)

## Base32 Plugin

### Decision Tree

```
Do you need standard Base32 secrets (RFC 4648) or otpauth URIs?
├── Yes → Use plugin-base32-scure (default, interoperable)
└── No
    ├── Plain UTF-8 string secret → plugin-base32-alt (bypassAsString)
    ├── Hex/Base16 secret         → plugin-base32-alt (bypassAsHex)
    └── Base64 secret             → plugin-base32-alt (bypassAsBase64)
```

### @otplib/plugin-base32-scure

Base32 encoding/decoding using [@scure/base](https://github.com/paulmillr/scure-base).

```typescript
import { base32 } from "@otplib/plugin-base32-scure";

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
    // `algorithm` is already canonical - `sha1`, `sha256` or `sha512` - and,
    // if you declared `algorithms`, already one of those. The factory checks
    // before calling this, so dispatch directly and do not re-validate.
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

#### Handling the algorithm

Crypto plugins receive one of `sha1`, `sha256` or `sha512`. Three rules apply:

1. **Never fall back to a default.** An unrecognised name must throw `AlgorithmUnsupportedError`, never
   resolve to some other digest — silently substituting a _different_ algorithm produces tokens that are
   self-consistent but never match other implementations, and the failure only shows up against a real
   authenticator app.

   Who performs that check depends on how you build the plugin:

   - **`createCryptoPlugin`** does it for you. Your `hmac` receives a canonical name that is already
     within `algorithms` when you declare one; calling `normalizeHashAlgorithm` again inside it is
     redundant.
   - **A class implementing `CryptoPlugin`** must call `normalizeHashAlgorithm` itself, passing
     `supported: this.algorithms` whenever it declares a restricted set. Nothing else enforces the
     declaration when the class is called directly.

   Matching ignores case and accepts an optional `-` or `_` before the digest size (`SHA1`, `SHA-1`,
   `sha_1` → `sha1`).

2. **Map inside the plugin.** If the implementation you wrap names algorithms differently, translate
   the canonical name locally rather than expecting callers to adapt. The Web Crypto plugin does exactly this:

   ```typescript
   const ALGORITHM_MAP = {
     sha1: "SHA-1",
     sha256: "SHA-256",
     sha512: "SHA-512",
   } as const satisfies Record<HashAlgorithm, string>;
   ```

   The `satisfies` clause is worth copying: it rejects a key outside `HashAlgorithm`, and — because
   `Record` requires every member — fails to compile if an algorithm is ever added without a mapping. Use
   it whenever your plugin covers all three.

   A plugin that covers only some of them wants `Partial` instead, which still forbids unknown keys while
   allowing a subset:

   ```typescript
   const ALGORITHM_MAP = {
     sha1: "SHA-1",
   } as const satisfies Partial<Record<HashAlgorithm, string>>;
   ```

3. **Declare `algorithms` if you support fewer than all three.** Derive it from the `Partial` map above
   rather than writing a second list, so the declaration cannot disagree with what the plugin actually
   dispatches:

   ```typescript
   const SUPPORTED_ALGORITHMS = Object.freeze(Object.keys(ALGORITHM_MAP) as HashAlgorithm[]);
   ```

   Freeze it, and note that `Object.keys(...) as readonly HashAlgorithm[]` does **not** do this — the
   annotation is erased at compile time, leaving a mutable array that could be pushed to in-process to
   broaden what your plugin claims to support. `Object.freeze` is what makes it hold at runtime.
   (`createCryptoPlugin` copies and freezes whatever you pass, so this applies to class-based plugins.)

   `CryptoContext` reads this and rejects an unsupported algorithm _before_ delegating, so callers get a
   clear error rather than one raised from inside your plugin. Omit it to mean the full set. It can only
   narrow - the value is intersected with `HASH_ALGORITHMS`, so listing a digest outside that set does not
   enable it.

::: warning A declaration is a contract, not a hint
`algorithms` must hold whether the plugin is reached through `CryptoContext` or called directly as
`plugin.hmac(...)`. `createCryptoPlugin` enforces it for you — it validates before invoking your `hmac`,
so the implementation only ever sees a canonical name it declared.

A **class-based plugin enforces its own declaration**. Pass the declared set through when you normalize:

```typescript
class RestrictedCryptoPlugin implements CryptoPlugin {
  readonly name = "restricted";
  readonly algorithms = ["sha1"] as const;

  hmac(algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array): Uint8Array {
    const alg = normalizeHashAlgorithm(algorithm, {
      supported: this.algorithms,
      plugin: this.name,
    });
    // ...
  }
}
```

Omitting `supported` here would leave the plugin accepting an algorithm it advertises it cannot compute
whenever it is called directly.
:::

`CryptoContext` normalizes before delegating too, so a plugin reached through the library is covered
regardless. That is a backstop, not a substitute: a class-based plugin is a public entry point in its own
right and must hold its contract when called directly.

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

Unlike `createCryptoPlugin`, a class is responsible for enforcing its own algorithm contract — nothing
wraps `hmac` on your behalf when it is called directly.

```typescript
import { normalizeHashAlgorithm } from "@otplib/core";
import type { CryptoPlugin, HashAlgorithm } from "@otplib/core";

const DIGESTS = {
  sha1: "SHA-1",
  sha256: "SHA-256",
} as const satisfies Partial<Record<HashAlgorithm, string>>;

class CustomCryptoPlugin implements CryptoPlugin {
  name = "custom";

  // Derived from the map, and frozen so it cannot be broadened at runtime
  algorithms = Object.freeze(Object.keys(DIGESTS) as HashAlgorithm[]);

  hmac(algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array) {
    const alg = normalizeHashAlgorithm(algorithm, {
      supported: this.algorithms,
      plugin: this.name,
    });

    // `alg` is canonical and within `algorithms` - safe to dispatch on
    const digest = DIGESTS[alg as keyof typeof DIGESTS];

    // your HMAC implementation here, using `digest`
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
