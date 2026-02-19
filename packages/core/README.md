# @otplib/core

Core types, interfaces, and utilities for the otplib OTP library suite.

## Overview

`@otplib/core` provides the foundational abstractions for all otplib packages:

- **Type Definitions** - TypeScript interfaces for OTP operations
- **Error Classes** - Hierarchical error types for validation and crypto operations
- **Validation Utilities** - Input validation for secrets, counters, time, and tokens
- **Crypto Abstraction** - Pluggable crypto backend via `CryptoContext`
- **Base32 Abstraction** - Pluggable Base32 encoding/decoding via `Base32Context`

This package is primarily used as a dependency by other otplib packages. Direct usage is only necessary when building custom plugins or extending the library.

> [!IMPORTANT] Breaking Changes (v13)
> The `totp` and `hotp` specific logic have been moved to their individual packages.
>
> See [Getting Started](https://otplib.yeojz.dev/guide/getting-started) for details.

## Installation

```bash
npm install @otplib/core
pnpm add @otplib/core
yarn add @otplib/core
```

## Documentation

Full API reference and usage guides at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [Plugins Guide](https://otplib.yeojz.dev/guide/plugins)
- [API Reference](https://otplib.yeojz.dev/api/)

## Related Packages

- `@otplib/hotp` - HOTP implementation (RFC 4226)
- `@otplib/totp` - TOTP implementation (RFC 6238)
- `@otplib/plugin-crypto-node` - Node.js crypto plugin
- `@otplib/plugin-crypto-web` - Web Crypto API plugin
- `@otplib/plugin-crypto-noble` - Noble hashes crypto plugin
- `@otplib/plugin-base32-scure` - Base32 plugin using @scure/base

## License

[MIT](./LICENSE)
