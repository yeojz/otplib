<picture>
  <source srcset="/assets/otplib-w.svg" media="(prefers-color-scheme: dark)">
  <img src="/assets/otplib-b.svg" alt="otplib-logo"  width="170">
</picture>

# otplib-repo

[![npm version](https://img.shields.io/npm/v/otplib.svg)](https://www.npmjs.com/package/otplib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/otplib.svg)](https://www.npmjs.com/package/otplib)
[![Code Repository](https://img.shields.io/github/stars/yeojz/otplib?style=flat)](https://github.com/yeojz/otplib)

TypeScript-first library for HOTP and TOTP / Authenticator with multi-runtime (Node, Bun, Deno, Browser) support via plugins.

A web based demo is available at [https://otplib.yeojz.dev](https://otplib.yeojz.dev).

## Features

- **Zero Configuration** - Works out of the box with sensible defaults
- **RFC Compliant** - RFC 6238 (TOTP) and RFC 4226 (HOTP)
- **TypeScript-First** - Full type definitions
- **Google Authenticator Compatible** - Full otpauth:// URI support
- **Plugin Interface** - Flexible plugin system for customising your cryptographic and base32 requirements (if you want to deviate from the defaults)
- **Cross-platform** - Tested against Node.js, Bun, Deno, and browsers

## Breaking Changes (v13)

> [!IMPORTANT]  
> v13 is a complete rewrite with breaking changes:
>
> - **New**
>   - **Security-audited plugins** — Default crypto uses `@noble/hashes` and `@scure/base`, both independently audited
>   - **Cross-platform defaults** — Works out-of-the-box in Node.js, Bun, Deno, and browsers
>   - **Full type safety** — Comprehensive TypeScript types with strict mode from the ground up
>   - **Async-first API** — All operations are async by default; sync variants available for compatible plugins
> - **Removed**
>   - **Separate authenticator package** — TOTP now covers all authenticator functionality
>   - **Outdated plugins** — Legacy crypto adapters removed in favor of modern, audited alternatives
>
> See [Migration Guide](https://otplib.yeojz.dev/guide/v12-adapter.html) for details.

## Quick Start

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

```typescript
import { generateSecret, generate, verify, generateURI } from "otplib";

// Generate a secret
const secret = generateSecret();

// Generate a TOTP token
const token = await generate({ secret });

// Verify a token
const result = await verify({ secret, token });
console.log(result.valid); // true
```

## Packages

| Package                                                         | Version                                                                                                                           | Downloads                                                                                                                          |
| :-------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| [`otplib`](./packages/otplib)                                   | [![npm](https://img.shields.io/npm/v/otplib.svg)](https://www.npmjs.com/package/otplib)                                           | [![npm](https://img.shields.io/npm/dm/otplib.svg)](https://www.npmjs.com/package/otplib)                                           |
| [`@otplib/core`](./packages/core)                               | [![npm](https://img.shields.io/npm/v/@otplib/core.svg)](https://www.npmjs.com/package/@otplib/core)                               | [![npm](https://img.shields.io/npm/dm/@otplib/core.svg)](https://www.npmjs.com/package/@otplib/core)                               |
| [`@otplib/totp`](./packages/totp)                               | [![npm](https://img.shields.io/npm/v/@otplib/totp.svg)](https://www.npmjs.com/package/@otplib/totp)                               | [![npm](https://img.shields.io/npm/dm/@otplib/totp.svg)](https://www.npmjs.com/package/@otplib/totp)                               |
| [`@otplib/hotp`](./packages/hotp)                               | [![npm](https://img.shields.io/npm/v/@otplib/hotp.svg)](https://www.npmjs.com/package/@otplib/hotp)                               | [![npm](https://img.shields.io/npm/dm/@otplib/hotp.svg)](https://www.npmjs.com/package/@otplib/hotp)                               |
| [`@otplib/uri`](./packages/uri)                                 | [![npm](https://img.shields.io/npm/v/@otplib/uri.svg)](https://www.npmjs.com/package/@otplib/uri)                                 | [![npm](https://img.shields.io/npm/dm/@otplib/uri.svg)](https://www.npmjs.com/package/@otplib/uri)                                 |
| [`@otplib/plugin-base32-scure`](./packages/plugin-base32-scure) | [![npm](https://img.shields.io/npm/v/@otplib/plugin-base32-scure.svg)](https://www.npmjs.com/package/@otplib/plugin-base32-scure) | [![npm](https://img.shields.io/npm/dm/@otplib/plugin-base32-scure.svg)](https://www.npmjs.com/package/@otplib/plugin-base32-scure) |
| [`@otplib/plugin-crypto-noble`](./packages/plugin-crypto-noble) | [![npm](https://img.shields.io/npm/v/@otplib/plugin-crypto-noble.svg)](https://www.npmjs.com/package/@otplib/plugin-crypto-noble) | [![npm](https://img.shields.io/npm/dm/@otplib/plugin-crypto-noble.svg)](https://www.npmjs.com/package/@otplib/plugin-crypto-noble) |
| [`@otplib/plugin-crypto-node`](./packages/plugin-crypto-node)   | [![npm](https://img.shields.io/npm/v/@otplib/plugin-crypto-node.svg)](https://www.npmjs.com/package/@otplib/plugin-crypto-node)   | [![npm](https://img.shields.io/npm/dm/@otplib/plugin-crypto-node.svg)](https://www.npmjs.com/package/@otplib/plugin-crypto-node)   |
| [`@otplib/plugin-crypto-web`](./packages/plugin-crypto-web)     | [![npm](https://img.shields.io/npm/v/@otplib/plugin-crypto-web.svg)](https://www.npmjs.com/package/@otplib/plugin-crypto-web)     | [![npm](https://img.shields.io/npm/dm/@otplib/plugin-crypto-web.svg)](https://www.npmjs.com/package/@otplib/plugin-crypto-web)     |

## Documentation

Refer to the [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started), or check out the other sections in the guide:

- [Advanced Usage](https://otplib.yeojz.dev/guide/advanced-usage)
- [Runtime Compatibility](https://otplib.yeojz.dev/guide/runtime-compatibility)
- [Security Considerations](https://otplib.yeojz.dev/guide/security)
- [API Reference](https://otplib.yeojz.dev/api/)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## AI Usage Disclosure

Since v13, parts of the codebase, tests, and documentation have been refined with AI assistance, with all outputs reviewed by humans. See [CONTRIBUTING.md](./CONTRIBUTING.md#ai-usage-guidelines) for guidelines.

## License

[MIT](./LICENSE)
