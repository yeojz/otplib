# @otplib/plugin-base32-bypass

Bypass plugins for otplib - use raw string secrets without Base32 encoding.

## Installation

```bash
npm install @otplib/plugin-base32-bypass
```

## Why?

Google Authenticator and similar apps expect Base32-encoded secrets, but the HOTP/TOTP RFCs work with raw bytes. If your secrets are already raw strings (passphrases), this plugin lets you bypass Base32 encoding.

## Usage

### UTF-8 String Secrets

```typescript
import { stringBypass } from "@otplib/plugin-base32-bypass";
import { generate } from "@otplib/totp";
import { crypto } from "@otplib/plugin-crypto-node";

const token = await generate({
  secret: "mysecretkey",
  base32: stringBypass,
  crypto,
});
```

### Custom Transformations

For hex-encoded or other formats, use `createBase32Plugin` with custom functions:

```typescript
import { createBase32Plugin } from "@otplib/plugin-base32-bypass";
import { hex } from "@scure/base";

// Hex bypass
const hexBypass = createBase32Plugin({
  name: "hex-bypass",
  encode: hex.encode,
  decode: hex.decode,
});

// Base64 bypass
const base64Bypass = createBase32Plugin({
  name: "base64-bypass",
  encode: (data) => btoa(String.fromCharCode(...data)),
  decode: (str) => new Uint8Array([...atob(str)].map((c) => c.charCodeAt(0))),
});
```

## API

### Exports

- `stringBypass` - Frozen plugin for UTF-8 string to bytes conversion
- `createBase32Plugin` - Factory function to create custom bypass plugins (re-exported from `@otplib/core`)

### Types

- `CreateBase32PluginOptions` - Options for `createBase32Plugin`

## License

MIT
