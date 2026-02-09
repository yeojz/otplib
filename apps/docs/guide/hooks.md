# Hooks

Hooks let you customise how OTP tokens are encoded and validated, enabling non-standard OTP variants (e.g., Steam Guard) without modifying the core library.

When no hooks are provided, the standard RFC 4226 numeric encoding is used.

## The OTPHooks Type

```typescript
import type { OTPHooks } from "@otplib/core";

type OTPHooks = {
  readonly encodeToken?: (truncatedValue: number, digits: number) => string;
  readonly validateToken?: (token: string, digits: number) => void;
};
```

| Hook            | Purpose                                                        | Default Behaviour                        |
| --------------- | -------------------------------------------------------------- | ---------------------------------------- |
| `encodeToken`   | Converts the 31-bit truncated HMAC integer into a token string | Decimal modulo (`10^digits`) zero-padded |
| `validateToken` | Checks that a token string is well-formed before verification  | Asserts digits-only and correct length   |

## How Hooks Integrate

Hooks are passed via the `hooks` option on `generate` / `verify` (and their sync variants). They apply at the HOTP layer and propagate automatically through TOTP.

```
HMAC → Dynamic Truncation → 31-bit integer
                                 │
                    ┌────────────┴────────────┐
                    │ encodeToken provided?    │
                    ├─── yes ──► hooks.encodeToken(value, digits)
                    └─── no  ──► truncateDigits(value, digits)
                                 │
                                 ▼
                            token string
```

During verification the same flow applies in reverse — `validateToken` is called before the token is compared:

```
token string
      │
      ├─── validateToken provided? ──► hooks.validateToken(token, digits)
      └─── no                      ──► default digit-only check
      │
      ▼
 compare against generated tokens
```

## Usage

### Generation

```typescript
import { generate } from "otplib";

const token = await generate({
  secret,
  hooks: {
    encodeToken: myEncodeToken,
  },
});
```

### Verification

When using a custom encoding, provide **both** hooks so that the library validates the token format correctly:

```typescript
import { verify } from "otplib";

const result = await verify({
  secret,
  token,
  hooks: {
    encodeToken: myEncodeToken,
    validateToken: myValidateToken,
  },
});
```

::: tip Both Hooks Together
If you provide `encodeToken`, you should also provide `validateToken`. Without it, the default validator rejects any token that is not purely numeric — which will cause verification to fail for non-numeric encodings.
:::

### Synchronous API

Hooks work identically with `generateSync` and `verifySync`:

```typescript
import { generateSync, verifySync } from "otplib";

const token = generateSync({
  secret,
  hooks: { encodeToken: myEncodeToken },
});

const result = verifySync({
  secret,
  token,
  hooks: {
    encodeToken: myEncodeToken,
    validateToken: myValidateToken,
  },
});
```

## Example: Steam Guard Encoding

Steam Guard uses a 5-character alphanumeric token instead of the standard 6-digit numeric OTP. Here is a complete implementation:

```typescript
const STEAM_CHARS = "23456789BCDFGHJKMNPQRTVWXY";

function steamEncodeToken(truncatedValue: number, digits: number): string {
  let code = "";
  let value = truncatedValue;
  for (let i = 0; i < digits; i++) {
    code += STEAM_CHARS[value % STEAM_CHARS.length];
    value = Math.floor(value / STEAM_CHARS.length);
  }
  return code;
}

function steamValidateToken(token: string, digits: number): void {
  if (token.length !== digits) {
    throw new Error(`Expected ${digits} characters, got ${token.length}`);
  }
  for (const ch of token) {
    if (!STEAM_CHARS.includes(ch)) {
      throw new Error(`Invalid character: ${ch}`);
    }
  }
}
```

Using it:

```typescript
import { generate, verify } from "otplib";

const steamHooks = {
  encodeToken: steamEncodeToken,
  validateToken: steamValidateToken,
};

// Generate a Steam Guard-style token (5 characters)
const token = await generate({
  secret,
  digits: 5,
  hooks: steamHooks,
});
// e.g., "V4XBK"

// Verify
const result = await verify({
  secret,
  token,
  digits: 5,
  hooks: steamHooks,
});
```

## Writing Custom Hooks

### encodeToken

Your `encodeToken` function receives:

| Parameter        | Type     | Description                                          |
| ---------------- | -------- | ---------------------------------------------------- |
| `truncatedValue` | `number` | 31-bit unsigned integer from HMAC dynamic truncation |
| `digits`         | `number` | Desired token length                                 |

It must return a `string` of the appropriate length.

### validateToken

Your `validateToken` function receives:

| Parameter | Type     | Description           |
| --------- | -------- | --------------------- |
| `token`   | `string` | Token to validate     |
| `digits`  | `number` | Expected token length |

It should **throw an error** if the token is malformed. Returning without throwing means the token format is valid.

### Guidelines

- Keep hooks **pure and deterministic** — the same inputs must always produce the same output.
- `encodeToken` should produce tokens of exactly `digits` length.
- `validateToken` should reject anything that `encodeToken` could not have produced.
- Hooks are called on every generate/verify invocation, so keep them lightweight.

## Hooks vs Plugins

| Aspect       | Plugins                                          | Hooks                                      |
| ------------ | ------------------------------------------------ | ------------------------------------------ |
| **Purpose**  | Swap infrastructure (crypto backend, Base32 lib) | Customise OTP behaviour (token format)     |
| **Scope**    | Affects HMAC computation or secret encoding      | Affects token encoding and validation only |
| **Examples** | `plugin-crypto-node`, `plugin-base32-scure`      | Steam Guard encoding, custom alphabets     |
| **Required** | Yes (crypto plugin is mandatory)                 | No (defaults to RFC 4226 numeric encoding) |
