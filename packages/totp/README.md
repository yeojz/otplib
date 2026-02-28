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

const secret = new Uint8Array([
  0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36,
  0x37, 0x38, 0x39, 0x30,
]); // 20-byte HMAC key

const token = await generate({
  secret, // Required: Uint8Array or Base32 string
  crypto, // Required: crypto plugin
  algorithm: "sha1", // Optional: 'sha1' | 'sha256' | 'sha512'
  digits: 6, // Optional: 6 | 7 | 8
  period: 30, // Optional: time step in seconds
  epoch: Date.now() / 1000, // Optional: Unix timestamp in seconds (defaults to now)
});
```

#### With Base32 secrets

If your secret is a Base32 string (e.g., from Google Authenticator), provide a `base32` plugin to decode it:

```typescript
import { generate } from "@otplib/totp";
import { crypto } from "@otplib/plugin-crypto-node";
import { base32 } from "@otplib/plugin-base32-scure";

const token = await generate({
  secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY",
  crypto,
  base32, // Required when secret is a string
});
```

#### With raw string secrets

If your secret is a plain string (e.g. a passphrase), convert it to `Uint8Array` first using `stringToBytes` from `@otplib/core`:

```typescript
import { generate } from "@otplib/totp";
import { crypto } from "@otplib/plugin-crypto-node";
import { stringToBytes } from "@otplib/core";

const token = await generate({
  secret: stringToBytes("mysecretpassphrase"),
  crypto,
});
```

Alternatively, [`@otplib/plugin-base32-alt`](https://www.npmjs.com/package/@otplib/plugin-base32-alt) provides bypass plugins for secrets in other encodings:

```typescript
import { generate } from "@otplib/totp";
import { crypto } from "@otplib/plugin-crypto-node";
import { bypassAsHex } from "@otplib/plugin-base32-alt";

const token = await generate({
  secret: "48656c6c6f", // hex-encoded secret
  base32: bypassAsHex,
  crypto,
});
```

| Name             | Input format     |
| ---------------- | ---------------- |
| `bypassAsString` | Raw UTF-8 string |
| `bypassAsHex`    | Hex string       |
| `bypassAsBase64` | Base64 string    |

> [!NOTE]
> Raw string and bypass secrets are **not compatible** with authenticator apps or `otpauth://` URIs, which always expect Base32-encoded secrets.

### verify

Verify a TOTP code:

```typescript
import { verify } from "@otplib/totp";
import { crypto } from "@otplib/plugin-crypto-node";

const result = await verify({
  secret, // Required: Uint8Array or Base32 string
  token: "123456", // Required: token to verify
  crypto, // Required: crypto plugin
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

const secret = new Uint8Array([
  0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36,
  0x37, 0x38, 0x39, 0x30,
]);

const token = generateSync({ secret, crypto });
const result = verifySync({ secret, token, crypto });
```

## Compatibility with Authenticator Apps

RFC 4226 (HOTP) and RFC 6238 (TOTP) define flexible algorithms that allow different hash functions, digit lengths, and time steps. However, most authenticator apps (Google Authenticator, Authy, Microsoft Authenticator, 1Password, etc.) and services offering 2 factor authentication use the following defaults:

| Parameter   | Value         |
| ----------- | ------------- |
| `algorithm` | `sha1`        |
| `digits`    | `6`           |
| `period`    | `30`          |
| `secret`    | Base32 string |

If you are deviating from these values, do validate that it is supported by the target application.

If you need to provision an authenticator app via QR code, use [`@otplib/uri`](https://www.npmjs.com/package/@otplib/uri) to generate an `otpauth://totp/` URI.

## Documentation

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE)
