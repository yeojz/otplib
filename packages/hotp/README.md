# @otplib/hotp

RFC 4226 HOTP implementation for otplib.

## Installation

```bash
npm install @otplib/hotp
pnpm install @otplib/hotp
yarn add @otplib/hotp
```

## Usage

### generate

Generate an HOTP code for a specific counter:

```typescript
import { generate } from "@otplib/hotp";
import { crypto } from "@otplib/plugin-crypto-node";

const secret = new Uint8Array([
  0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36,
  0x37, 0x38, 0x39, 0x30,
]); // 20-byte HMAC key

const token = await generate({
  secret, // Required: Uint8Array or Base32 string
  counter: 0, // Required: counter value
  crypto, // Required: crypto plugin
  algorithm: "sha1", // Optional: 'sha1' | 'sha256' | 'sha512'
  digits: 6, // Optional: 6 | 7 | 8
});
```

#### With Base32 secrets

If your secret is a Base32 string (e.g., from Google Authenticator), provide a `base32` plugin to decode it:

```typescript
import { generate } from "@otplib/hotp";
import { crypto } from "@otplib/plugin-crypto-node";
import { base32 } from "@otplib/plugin-base32-scure";

const token = await generate({
  secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY",
  counter: 0,
  crypto,
  base32, // Required when secret is a string
});
```

### verify

Verify an HOTP code:

```typescript
import { verify } from "@otplib/hotp";
import { crypto } from "@otplib/plugin-crypto-node";

const result = await verify({
  secret, // Required: Uint8Array or Base32 string
  token: "123456", // Required: token to verify
  counter: 0, // Required: expected counter
  crypto, // Required: crypto plugin
  algorithm: "sha1", // Optional: hash algorithm
  digits: 6, // Optional: expected digits
  counterTolerance: 5, // Optional: number or [past, future] tuple
});

// Returns: { valid: true, delta: number } | { valid: false }
```

`counterTolerance` accepts a plain number (creates a look-ahead-only window `[0, n]`, the secure default per RFC 4226) or a `[past, future]` tuple for explicit control (e.g., `[2, 5]`).

### Sync Variants

`generateSync` and `verifySync` are synchronous alternatives with the same signatures. They require a crypto plugin that supports sync HMAC operations, such as `@otplib/plugin-crypto-node` or `@otplib/plugin-crypto-noble`. Using them with `@otplib/plugin-crypto-web` will throw.

```typescript
import { generateSync, verifySync } from "@otplib/hotp";
import { crypto } from "@otplib/plugin-crypto-node";

const secret = new Uint8Array([
  0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36,
  0x37, 0x38, 0x39, 0x30,
]);

const token = generateSync({ secret, counter: 0, crypto });
const result = verifySync({ secret, token, counter: 0, crypto });
```

## Documentation

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE)
