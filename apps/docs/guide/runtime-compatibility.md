# Runtime Compatibility

otplib is designed to work across multiple JavaScript runtimes. This guide covers compatibility with Node.js, Bun, and Deno.

## Compatibility Matrix

| Package                       | Node.js         | Bun / Deno      | Browser         |
| ----------------------------- | --------------- | --------------- | --------------- |
| Core packages                 | _Universal_     | _Universal_     | _Universal_     |
| `@otplib/plugin-crypto-node`  | **Recommended** | Alternative     | Not Supported   |
| `@otplib/plugin-crypto-noble` | Alternative     | **Recommended** | **Recommended** |
| `@otplib/plugin-crypto-web`   | Alternative     | Alternative     | **Recommended** |

> **Core packages** include: `otplib`, `@otplib/core`, `@otplib/hotp`, `@otplib/totp`, `@otplib/uri`, `@otplib/plugin-base32-scure`

## Recommended Plugins by Runtime

### Node.js

**Recommended:** `@otplib/plugin-crypto-node` - Best performance using native `node:crypto`

```typescript
import { generate, verify, generateSecret } from "otplib";
import { crypto } from "@otplib/plugin-crypto-node";
import { base32 } from "@otplib/plugin-base32-scure";

const secret = generateSecret({ crypto, base32 });
const token = await generate({ secret, crypto, base32 });
```

**Alternatives:**

- `plugin-crypto-noble` - Pure JS, good for environments without native crypto
- `plugin-crypto-web` - Works in Node.js 15+, uses Web Crypto API

### Bun / Deno

**Recommended:** `@otplib/plugin-crypto-noble` - Pure JS, consistent cross-runtime behavior

```typescript
import { generate, verify, generateSecret } from "otplib";
import { crypto } from "@otplib/plugin-crypto-noble";
import { base32 } from "@otplib/plugin-base32-scure";

const secret = generateSecret({ crypto, base32 });
const token = await generate({ secret, crypto, base32 });
```

**Alternatives:**

- `plugin-crypto-node` - Works via Node.js compatibility layer
- `plugin-crypto-web` - Uses native Web Crypto API (Deno) or compatibility (Bun)

### Browser

**Recommended:** `@otplib/plugin-crypto-web` - Uses native Web Crypto API

```typescript
import { generate, verify, generateSecret } from "otplib";
import { crypto } from "@otplib/plugin-crypto-web";
import { base32 } from "@otplib/plugin-base32-scure";

const secret = generateSecret({ crypto, base32 });
const token = await generate({ secret, crypto, base32 });
```

**Alternatives:**

- `plugin-crypto-noble` - Pure JS implementation, works everywhere

::: warning
The Web Crypto API requires a secure context (HTTPS) in browsers. Token generation will fail on non-secure origins.
:::

## Universal Code

For code that needs to run across all runtimes, use the pure JavaScript plugins:

```typescript
import { generate, verify, generateSecret } from "otplib";
import { crypto } from "@otplib/plugin-crypto-noble";
import { base32 } from "@otplib/plugin-base32-scure";

// Works in Node.js, Bun, Deno, and browsers

async function generateOTP(secret: string): Promise<string> {
  return generate({ secret, crypto, base32 });
}

async function verifyOTP(secret: string, token: string): Promise<boolean> {
  const result = await verify({ secret, token, crypto, base32 });
  return result.valid;
}
```

::: tip
The main `otplib` package uses `@otplib/plugin-crypto-noble` by default, making it work across all runtimes out of the box.
:::

::: warning Sync API Compatibility
The `generateSync` and `verifySync` methods (available in both Class and Functional APIs) **only work** with plugins that support synchronous operations, such as:

- `@otplib/plugin-crypto-node`
- `@otplib/plugin-crypto-noble` (default)

They **will throw an error** if used with async-only plugins like:

- `@otplib/plugin-crypto-web` (Web Crypto API is async only)
  :::

## Runtime-Specific Notes

### Bun

Bun provides excellent compatibility with npm packages. Install and use otplib as you would in Node.js:

```bash
bun add otplib
```

### Deno

For Deno, you can import from npm using the `npm:` specifier:

```typescript
import { generate, generateSecret } from "npm:otplib";

const secret = generateSecret();
const token = await generate({ secret, strategy: "totp" });
```

Or use an import map in `deno.json`:

```json
{
  "imports": {
    "otplib": "npm:otplib"
  }
}
```

Then import normally:

```typescript
import { generate, generateSecret } from "otplib";
```

## Performance Considerations

| Plugin                | Performance | Use Case                        |
| --------------------- | ----------- | ------------------------------- |
| `plugin-crypto-node`  | Fastest     | Node.js production servers      |
| `plugin-crypto-noble` | Good        | Cross-runtime, security-audited |
| `plugin-crypto-web`   | Good        | Browsers, Web Workers           |

For high-throughput applications on Node.js, `plugin-crypto-node` offers the best performance as it uses the native crypto module. For universal code or security-critical applications, `plugin-crypto-noble` uses the audited [@noble/hashes](https://github.com/paulmillr/noble-hashes) library.

## Testing Across Runtimes

otplib is tested across all three major runtimes to ensure compatibility:

```bash
# Node.js (Vitest)
pnpm test

# Bun
pnpm test:bun

# Deno
pnpm test:deno
```

All core functionality including HOTP and TOTP are verified against RFC 4226 and RFC 6238 test vectors on each runtime.

## Edge Runtimes

otplib works in edge computing environments like Cloudflare Workers, Vercel Edge Functions, and Deno Deploy:

```typescript
// Cloudflare Workers / Vercel Edge
import { generate } from "otplib";
import { crypto } from "@otplib/plugin-crypto-web";
import { base32 } from "@otplib/plugin-base32-scure";

export default {
  async fetch(request: Request): Promise<Response> {
    const token = await generate({
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY",
      crypto,
      base32,
    });
    return new Response(token);
  },
};
```

## Troubleshooting

### "crypto is not defined" in Deno

Ensure you're using a plugin that's compatible with Deno:

```typescript
// Use noble plugin for universal compatibility
import { crypto } from "@otplib/plugin-crypto-noble";
```

### Module resolution issues in Bun

If you encounter module resolution issues, ensure your `package.json` has the correct type:

```json
{
  "type": "module"
}
```

### Web Crypto not available

The Web Crypto API requires a secure context. For local development:

```bash
# Use HTTPS locally
npx serve -s build --ssl-cert cert.pem --ssl-key key.pem
```

Or use the noble plugin which doesn't require Web Crypto:

```typescript
import { crypto } from "@otplib/plugin-crypto-noble";
```
