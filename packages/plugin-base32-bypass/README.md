# @otplib/plugin-base32-bypass

Bypass plugins for otplib - use raw string or hex secrets without Base32 encoding.

## Installation

```bash
npm install @otplib/plugin-base32-bypass
```

## Why?

Google Authenticator and similar apps expect Base32-encoded secrets, but the HOTP/TOTP RFCs work with raw bytes. If your secrets are already raw strings or hex-encoded, this plugin lets you bypass Base32 encoding.

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

### Hex-Encoded Secrets

```typescript
import { hexBypass } from "@otplib/plugin-base32-bypass";
import { generate } from "@otplib/totp";
import { crypto } from "@otplib/plugin-crypto-node";

const token = await generate({
  secret: "4d79736563726574",
  base32: hexBypass,
  crypto,
});
```

### Custom Transformations

```typescript
import { BypassBase32Plugin } from "@otplib/plugin-base32-bypass";

const base64Bypass = new BypassBase32Plugin({
  encode: (data) => btoa(String.fromCharCode(...data)),
  decode: (str) => new Uint8Array([...atob(str)].map((c) => c.charCodeAt(0))),
});
```

## API

### Classes

- `BypassBase32Plugin` - Generic bypass with custom encode/decode functions
- `StringBypassPlugin` - UTF-8 string to bytes conversion
- `HexBypassPlugin` - Hex string to bytes conversion

### Singletons

- `stringBypass` - Frozen instance of `StringBypassPlugin`
- `hexBypass` - Frozen instance of `HexBypassPlugin`

## License

MIT
