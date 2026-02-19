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
import { base32 } from "@otplib/plugin-base32-scure";

const token = await generate({
  secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY", // Required: Base32 string or Uint8Array
  counter: 0, // Required: counter value
  crypto, // Required: crypto plugin
  base32, // Optional: base32 plugin (required if secret is a string)
  algorithm: "sha1", // Optional: 'sha1' | 'sha256' | 'sha512'
  digits: 6, // Optional: 6 | 7 | 8
});
```

### verify

Verify an HOTP code:

```typescript
import { verify } from "@otplib/hotp";
import { crypto } from "@otplib/plugin-crypto-node";
import { base32 } from "@otplib/plugin-base32-scure";

const result = await verify({
  secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY", // Required: Base32 string or Uint8Array
  token: "123456", // Required: token to verify
  counter: 0, // Required: expected counter
  crypto, // Required: crypto plugin
  base32, // Optional: base32 plugin (required if secret is a string)
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

const token = generateSync({ secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY", counter: 0, crypto });
const result = verifySync({ secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY", token, counter: 0, crypto });
```

## Documentation

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE)
