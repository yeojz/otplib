# @otplib/totp

RFC 6238 TOTP implementation for otplib.

## Installation

```bash
npm install @otplib/totp
pnpm install @otplib/totp
yarn add @otplib/totp
```

## Usage

```typescript
import { generate, verify } from "@otplib/totp";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const crypto = new NodeCryptoPlugin();
const base32 = new ScureBase32Plugin();

// Generate a TOTP token
const token = await generate({
  secret: "JBSWY3DPEHPK3PXP",
  crypto,
  base32,
});

// Verify a TOTP token
const result = await verify({
  secret: "JBSWY3DPEHPK3PXP",
  token: "123456",
  crypto,
  base32,
});

// result.valid: boolean
// result.delta: number | null
```

## Functions

### generate

Generate a TOTP code:

```typescript
import { generate } from '@otplib/totp';

const token = await generate({
  secret: new Uint8Array([...]),  // Required: secret as bytes
  crypto: new NodeCryptoPlugin(),  // Required: crypto plugin
  base32: new ScureBase32Plugin(), // Optional: base32 plugin (for decoding)
  algorithm: 'sha1',               // Optional: 'sha1' | 'sha256' | 'sha512'
  digits: 6,                       // Optional: 6 | 7 | 8
  period: 30,                      // Optional: time step in seconds
  epoch: Math.floor(Date.now() / 1000), // Optional: current time in seconds
});
```

### verify

Verify a TOTP code:

```typescript
import { verify } from '@otplib/totp';

const result = await verify({
  secret: new Uint8Array([...]),  // Required: secret as bytes
  token: '123456',                 // Required: token to verify
  crypto: new NodeCryptoPlugin(),  // Required: crypto plugin
  base32: new ScureBase32Plugin(), // Optional: base32 plugin (for decoding)
  algorithm: 'sha1',               // Optional: hash algorithm
  digits: 6,                       // Optional: expected digits
  period: 30,                      // Optional: time step
  epoch: Math.floor(Date.now() / 1000), // Optional: current time
  epochTolerance: 30,              // Optional: time tolerance in seconds
});

// Returns: { valid: boolean, delta: number | null }
```

### getRemainingTime

Get the remaining time before the next TOTP period:

```typescript
import { getRemainingTime } from "@otplib/totp";

const seconds = getRemainingTime(
  Math.floor(Date.now() / 1000), // time
  30, // period
  0, // t0
);

// Returns: number of seconds remaining
```

### getTimeStepUsed

Get the time step used for a specific time:

```typescript
import { getTimeStepUsed } from "@otplib/totp";

const counter = getTimeStepUsed(
  Math.floor(Date.now() / 1000), // time
  30, // period
  0, // t0
);

// Returns: the counter value
```

## Documentation

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE) © 2026 Gerald Yeo
