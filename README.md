<picture>
  <source srcset="/assets/otplib-w.svg" media="(prefers-color-scheme: dark)">
  <img src="/assets/otplib-b.svg" alt="otplib-logo"  width="170">
</picture>

# otplib-repo

[![npm version](https://img.shields.io/npm/v/otplib.svg)](https://www.npmjs.com/package/otplib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/otplib.svg)](https://www.npmjs.com/package/otplib)
[![Code Repository](https://img.shields.io/github/stars/yeojz/otplib?style=flat)](https://github.com/yeojz/otplib)

TypeScript-first library for HOTP and TOTP / Authenticator with multi-runtime and plugin support

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
> See [Migration Guide](https://otplib.yeojz.dev/guide/migrating-v12-to-v13) for details.

## Quick Start

```bash
npm install otplib
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

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev) - including:

- Getting Started guide
- Runtime compatibility (Node.js, Bun, Deno, Browsers)
- API reference
- Security considerations
- Advanced usage

## Requirements

- Node.js >= 20.0.0 (or Bun/Deno)
- TypeScript 5.0+ (for type definitions) |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## AI Usage Disclosure

Since v13, parts of the codebase, tests, and documentation have been refined with AI assistance, with all outputs reviewed by humans. See [CONTRIBUTING.md](./CONTRIBUTING.md#ai-usage-guidelines) for guidelines.

## License

[MIT](./LICENSE) © 2026 Gerald Yeo
