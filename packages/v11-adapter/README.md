# @otplib/preset-v11

> Drop-in replacement adapter for migrating `otplib` from v11 to v13.

This adapter mimics the v11 API while using v13's plugins under the hood. However, some fundamental changes from v13 may carry over.

**Note:** This is intended as a temporary bridge to help you upgrade to v13 without rewriting your entire application immediately. We strongly recommend fully migrating to the new v13 API when possible.

## Installation

```bash
npm install @otplib/preset-v11
pnpm add @otplib/preset-v11
yarn add @otplib/preset-v11
```

## Usage

This package provides a drop-in replacement for `otplib` v11, using the v13 core.

```javascript
import { authenticator, hotp, totp } from "@otplib/preset-v11";

const secret = authenticator.generateSecret();
const token = authenticator.generate(secret);
const isValid = authenticator.check(token, secret);
```

## Compatibility Notes

- **Epoch**: Uses seconds (UNIX timestamp), same as v11.
- **Error Handling**: `check` and `verify` methods swallow errors and return `false`, matching v11 behavior.
- **Secret Length**: Enforces strict secret length (> 16 bytes) due to v13 core security requirements.
- **Key Encodings (HOTP/TOTP)**: for `HOTP` and `TOTP`, `encoding` accepts `ascii`, `hex`, `base32`, `base64`, `latin1`, and `utf8`, matching Node's `Buffer.from(secret, encoding)` semantics. `ascii` and `latin1` take the low byte of each UTF-16 code unit; `utf8` (and any unrecognised value) is treated as UTF-8. Base64 decoding is stricter than Node: any non-canonical input (invalid characters, or legal-alphabet input with non-zero padding bits) throws instead of silently decoding to a different key. This does not apply to `Authenticator`: its `encode`/`decode` defaults ignore `encoding` and always use UTF-8/Base32.

## Migration Guide

For a full guide on migrating to v13 refer to the [Migration Guide](https://otplib.yeojz.dev/guide/v11-adapter).

## License

[MIT](./LICENSE)
