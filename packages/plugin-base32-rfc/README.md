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

It accepts and rejects the same inputs as `@otplib/plugin-base32-scure`, with the same error messages, so the two plugins are interchangeable. This parity is a maintained compatibility target: the package's tests compare both plugins on every test run.

## Why this plugin

`@otplib/plugin-base32-scure`, the default in `otplib`, works well in most setups. This plugin exists for two cases where it doesn't fit:

- **CommonJS without ESM support.** `@scure/base` is published only as an ES module. The scure plugin's CommonJS build loads it with `require()`, which fails with `ERR_REQUIRE_ESM` on runtimes that can't `require()` ES modules: Node.js older than 20.19 / 22.12, or setups with a CommonJS loader hook such as a TypeScript register hook. This plugin has no dependencies, so its CommonJS build loads anywhere. To avoid the error, use it with the standalone packages (`@otplib/totp` and `@otplib/plugin-crypto-node`) rather than `otplib`; see [CommonJS without require() of ES modules](#commonjs-without-require-of-es-modules).
- **No third-party dependencies.** The whole plugin is maintained in the otplib repository and released with the rest of otplib. It adds no other maintainer or package to your dependency tree, which keeps your supply chain smaller and simpler to review.

### Which plugin should I use?

| Situation                                               | Plugin                       |
| ------------------------------------------------------- | ---------------------------- |
| ESM, or Node.js that can `require()` ES modules         | Either; scure is the default |
| CommonJS on a runtime that can't `require()` ES modules | `@otplib/plugin-base32-rfc`  |
| You want no dependencies outside otplib                 | `@otplib/plugin-base32-rfc`  |

Both produce and accept the same secrets, so you can switch at any time without re-enrolling users.

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

> **Important:** passing this plugin as the `base32` option to functions imported from `otplib` is not enough. `require("otplib")` still loads its default plugins, `@otplib/plugin-base32-scure` and `@otplib/plugin-crypto-noble`, and with them their ESM-only dependencies. Import from the standalone packages below instead of `otplib`.

```javascript
const { generateSecret } = require("@otplib/core");
const { generate, verify } = require("@otplib/totp");
const { crypto } = require("@otplib/plugin-crypto-node");
const { base32 } = require("@otplib/plugin-base32-rfc");

async function main() {
  const secret = generateSecret({ crypto, base32 });
  const token = await generate({ secret, crypto, base32 });
  const result = await verify({ secret, token, crypto, base32 });
  console.log(result.valid); // true
}

main();
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

## Acknowledgements

The decoding checks and error messages are adapted from [`@scure/base`](https://github.com/paulmillr/scure-base) (MIT, Copyright (c) 2022 Paul Miller), so this plugin rejects exactly the same inputs as `@otplib/plugin-base32-scure`. The adapted parts are in [`src/codec.ts`](./src/codec.ts), and the `@scure/base` licence is included in [`LICENSE`](./LICENSE).

## License

[MIT](./LICENSE)
