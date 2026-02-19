# @otplib/totp

RFC 6238 TOTP implementation for otplib.

## Installation

```bash
npm install @otplib/totp
pnpm install @otplib/totp
yarn add @otplib/totp
```

## Usage

### generate

Generate a TOTP code:

```typescript
import { generate } from "@otplib/totp";
import { crypto } from "@otplib/plugin-crypto-node";
import { base32 } from "@otplib/plugin-base32-scure";

const token = await generate({
  secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY", // Required: Base32 string or Uint8Array
  crypto, // Required: crypto plugin
  base32, // Optional: base32 plugin (required if secret is a string)
  algorithm: "sha1", // Optional: 'sha1' | 'sha256' | 'sha512'
  digits: 6, // Optional: 6 | 7 | 8
  period: 30, // Optional: time step in seconds
  epoch: Date.now() / 1000, // Optional: Unix timestamp in seconds (defaults to now)
});
```

### verify

Verify a TOTP code:

```typescript
import { verify } from "@otplib/totp";
import { crypto } from "@otplib/plugin-crypto-node";
import { base32 } from "@otplib/plugin-base32-scure";

const result = await verify({
  secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY", // Required: Base32 string or Uint8Array
  token: "123456", // Required: token to verify
  crypto, // Required: crypto plugin
  base32, // Optional: base32 plugin (required if secret is a string)
  algorithm: "sha1", // Optional: hash algorithm
  digits: 6, // Optional: expected digits
  period: 30, // Optional: time step in seconds
  epoch: Date.now() / 1000, // Optional: Unix timestamp in seconds (defaults to now)
  epochTolerance: 30, // Optional: number or [past, future] tuple
  afterTimeStep: lastTimeStep, // Optional: reject time steps <= this value (replay protection)
});

// Returns: { valid: true, delta: number, epoch: number, timeStep: number } | { valid: false }
```

`epochTolerance` accepts a number (symmetric window `±n` seconds) or a `[past, future]` tuple for asymmetric control (e.g., `[30, 0]` accepts only past tokens, as recommended by RFC 6238 for transmission-delay handling).

`afterTimeStep` is an exclusive lower bound on the matched time step: any match at `timeStep <= afterTimeStep` is rejected. Pass the `timeStep` from the previous successful verification to prevent token reuse.

### getRemainingTime

Get remaining seconds until the next TOTP period. All parameters are optional and default to the current time with a 30-second period:

```typescript
import { getRemainingTime } from "@otplib/totp";

const seconds = getRemainingTime(); // uses current time, period=30, t0=0
const seconds2 = getRemainingTime(epoch, 30); // explicit time and period
```

### getTimeStepUsed

Get the current TOTP counter (time step) value. All parameters are optional:

```typescript
import { getTimeStepUsed } from "@otplib/totp";

const counter = getTimeStepUsed(); // uses current time, period=30, t0=0
const counter2 = getTimeStepUsed(epoch, 30); // explicit time and period
```

### Sync Variants

`generateSync` and `verifySync` are synchronous alternatives with the same signatures. They require a crypto plugin that supports sync HMAC operations, such as `@otplib/plugin-crypto-node` or `@otplib/plugin-crypto-noble`. Using them with `@otplib/plugin-crypto-web` will throw.

```typescript
import { generateSync, verifySync } from "@otplib/totp";
import { crypto } from "@otplib/plugin-crypto-node";

const token = generateSync({ secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY", crypto });
const result = verifySync({ secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY", token, crypto });
```

## Documentation

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE)
