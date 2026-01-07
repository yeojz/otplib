# @otplib/hotp

RFC 4226 HOTP implementation for otplib.

## Installation

```bash
npm install @otplib/hotp
pnpm install @otplib/hotp
yarn add @otplib/hotp
```

## Usage

```typescript
import { generate, verify } from "@otplib/hotp";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const crypto = new NodeCryptoPlugin();
const base32 = new ScureBase32Plugin();

// Generate an HOTP token for counter 0
const token = await generate({
  secret: "JBSWY3DPEHPK3PXP",
  counter: 0,
  crypto,
  base32,
});

// Verify an HOTP token
const result = await verify({
  secret: "JBSWY3DPEHPK3PXP",
  token: "123456",
  counter: 0,
  crypto,
  base32,
  counterTolerance: 0,
});

// result.valid: boolean
// result.delta: number | null
```

## Functions

### generate

Generate an HOTP code for a specific counter:

```typescript
import { generate } from '@otplib/hotp';

const token = await generate({
  secret: new Uint8Array([...]),  // Required: secret as bytes
  counter: 0,                      // Required: counter value
  crypto: new NodeCryptoPlugin(),  // Required: crypto plugin
  base32: new ScureBase32Plugin(), // Optional: base32 plugin (for decoding)
  algorithm: 'sha1',               // Optional: 'sha1' | 'sha256' | 'sha512'
  digits: 6,                       // Optional: 6 | 7 | 8
});
```

### verify

Verify an HOTP code:

```typescript
import { verify } from '@otplib/hotp';

const result = await verify({
  secret: new Uint8Array([...]),  // Required: secret as bytes
  token: '123456',                 // Required: token to verify
  counter: 0,                      // Required: expected counter
  crypto: new NodeCryptoPlugin(),  // Required: crypto plugin
  base32: new ScureBase32Plugin(), // Optional: base32 plugin (for decoding)
  algorithm: 'sha1',               // Optional: hash algorithm
  digits: 6,                       // Optional: expected digits
  counterTolerance: 5,             // Optional: look-ahead tolerance
});

// Returns: { valid: boolean, delta: number | null }
```

## Documentation

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE) © 2026 Gerald Yeo
