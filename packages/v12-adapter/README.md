# @otplib/v12-adapter

> Drop-in replacement adapter for migrating `otplib` from v12 to v13.

This adapter mimics the v12 synchronous API while using v13's plugins under the hood. However, some fundamental changes from v13 may carry over.

**Note:** This is intended as a temporary bridge to help you upgrade to v13 without rewriting your entire application immediately. We strongly recommend fully migrating to the new v13 API when possible.

## Installation

```bash
npm install @otplib/v12-adapter
pnpm add @otplib/v12-adapter
yarn add @otplib/v12-adapter
```

## Usage

Simply update your imports from `otplib` to `@otplib/v12-adapter`.

### Before (v12)

```typescript
import { authenticator } from "otplib";

const secret = authenticator.generateSecret();
const token = authenticator.generate(secret);
const isValid = authenticator.verify({ token, secret });
```

### After (v13 with Adapter)

```typescript
import { authenticator } from "@otplib/v12-adapter";

// API remains exactly the same
const secret = authenticator.generateSecret();
const token = authenticator.generate(secret);
const isValid = authenticator.verify({ token, secret });
```

## Limitations

- **Class/Instance API Only**: This adapter only exports the `authenticator`, `totp`, and `hotp` singleton instances and their classes. If you were importing specific utility functions directly from `otplib/core` or other internal paths in v12, those are not covered by this adapter.
- **Sync/Async**: While this adapter provides a synchronous-looking API (like v12), it uses v13's plugins under the hood. For standard Node.js usage with the default `crypto` module, this works seamlessly.

## Migration Guide

For a full guide on migrating to v13, including the benefits of the new architecture and how to use the new features, please see the [Migration Guide](https://otplib.yeojz.dev/guide/v12-adapter).

## License

[MIT](./LICENSE)
