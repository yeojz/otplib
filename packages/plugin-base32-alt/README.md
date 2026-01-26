# @otplib/plugin-base32-alt

Alternative encoding plugins for otplib that accept raw string secrets without
Base32 encoding.

## Installation

```bash
npm install @otplib/plugin-base32-alt
pnpm add @otplib/plugin-base32-alt
yarn add @otplib/plugin-base32-alt
```

## Overview

`otplib` treats string secrets as Base32 by default because authenticator apps
and otpauth URIs expect RFC 4648 encoding.

This plugin bypasses Base32 and converts the provided string directly into
bytes (for example, passphrases or secrets stored as hex/base64).

> [!Note]
>
> - Otpauth URI generation still expects Base32 secrets.
> - Errors are still surfaced as `Base32DecodeError` or `Base32EncodeError`.
>   The underlying cause is returned under the error's `cause` property

## Usage

### UTF-8 string secrets

```typescript
import { generate } from "otplib";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { bypassAsString } from "@otplib/plugin-base32-alt";

const crypto = new NodeCryptoPlugin();

const token = await generate({
  secret: "mysecretkey",
  base32: bypassAsString,
  crypto,
});
```

### Hex-encoded secrets

```typescript
import { generate } from "otplib";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { bypassAsHex } from "@otplib/plugin-base32-alt";

const crypto = new NodeCryptoPlugin();

const token = await generate({
  secret: "48656c6c6f", // "Hello" in hex
  base32: bypassAsHex,
  crypto,
});
```

The hex bypass:

- Accepts both lowercase (`abcdef`) and uppercase (`ABCDEF`) hex characters
- Validates input: throws `Base32DecodeError` for odd-length strings or invalid
  characters
- Produces lowercase hex output when encoding

Note: `bypassAsBase16` is available as an alias for `bypassAsHex`.

### Base64-encoded secrets

```typescript
import { generate } from "otplib";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { bypassAsBase64 } from "@otplib/plugin-base32-alt";

const crypto = new NodeCryptoPlugin();

const token = await generate({
  secret: "SGVsbG8=", // "Hello" in base64
  base32: bypassAsBase64,
  crypto,
});
```

### Custom Transformations

For other formats, `createBase32Plugin` can be paired with custom functions:

```typescript
import { createBase32Plugin } from "@otplib/plugin-base32-alt";

// Custom encoding bypass
const customBypass = createBase32Plugin({
  name: "custom-bypass",
  encode: (data) => /* bytes to string */,
  decode: (str) => /* string to bytes */,
});
```

## API

### Exports

- `bypassAsString` - Frozen plugin for UTF-8 string to bytes conversion
- `bypassAsHex` - Frozen plugin for hex string to bytes conversion
- `bypassAsBase16` - Alias for `bypassAsHex`
- `bypassAsBase64` - Frozen plugin for base64 string to bytes conversion
- `createBase32Plugin` - Factory for custom bypass plugins (re-exported from
  `@otplib/core`)

### Types

- `CreateBase32PluginOptions` - Options for `createBase32Plugin`

## License

[MIT](./LICENSE) © 2026 Gerald Yeo
