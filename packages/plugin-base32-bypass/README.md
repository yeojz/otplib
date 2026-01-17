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

For hex-encoded or other formats, use `BypassBase32Plugin` with custom functions:

```typescript
import { BypassBase32Plugin } from "@otplib/plugin-base32-bypass";
import { hex } from "@scure/base";

// Hex bypass
const hexBypass = new BypassBase32Plugin({
  encode: hex.encode,
  decode: hex.decode,
});

// Base64 bypass
const base64Bypass = new BypassBase32Plugin({
  encode: (data) => btoa(String.fromCharCode(...data)),
  decode: (str) => new Uint8Array([...atob(str)].map((c) => c.charCodeAt(0))),
});
```

## API

### Classes

- `BypassBase32Plugin` - Generic bypass with custom encode/decode functions
- `StringBypassPlugin` - UTF-8 string to bytes conversion

### Singletons

- `stringBypass` - Frozen instance of `StringBypassPlugin`

## License

MIT
