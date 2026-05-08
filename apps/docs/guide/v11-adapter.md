# Migration (v11 Adapter)

This adapter mimics the v11 APIs while using v13's plugins under the hood. However, some fundamental changes from v13 may carry over.

::: info Recommendation
This adapter is intended as a temporary bridge.
You are still recommended to do a full migration to use v13 directly for full compatibility and future-proofing.
:::

::: warning Class/Instance API Only
This adapter only exports the `authenticator`, `totp`, and `hotp` singleton instances and their classes. If you were importing specific utility functions directly from `otplib/core` or other internal paths in v12, those are not covered by this adapter.
:::

## Installation

```bash
npm install @otplib/preset-v11
```

## Usage

Replace your `otplib` imports with `@otplib/preset-v11`:

```javascript
// Old v11 code
import { authenticator } from "otplib";

// New code with adapter
import { authenticator } from "@otplib/preset-v11";

const secret = authenticator.generateSecret();
const token = authenticator.generate(secret);
const isValid = authenticator.check(token, secret);
```

## Compatibility Notes

### Epoch

The adapter uses seconds (UNIX timestamp) to match v11 behavior.

### Error Handling

The `check` and `verify` methods swallow errors and return `false`, matching v11 behavior.

### Secret Length

Strict secret length checks (> 16 bytes) are enforced due to security requirements in the v13 core.

::: warning Legacy Secrets
Generate or verify calls with secrets shorter than 16 bytes (measured after Base32 decoding, where applicable) will now throw `SecretTooShortError`. The minimum is not relaxed by default, to preserve security. If you need to keep accepting shorter legacy secrets, override the `MIN_SECRET_BYTES` guardrail. See [Danger Zone - Guardrails](/guide/danger-zone#guardrails) for the override and [Troubleshooting - SecretTooShortError](/guide/troubleshooting#secrettooshorterror) for examples.
:::

::: tip See Also
For a comprehensive overview of v13 changes, breaking changes, and detailed migration patterns, refer to the [v12 Adapter Migration Guide](./v12-adapter.md).
:::
