# @otplib/plugin-base32-scure

Base32 encoding/decoding plugin for otplib using the `@scure/base` library.

## Installation

```bash
npm install @otplib/plugin-base32-scure
pnpm add @otplib/plugin-base32-scure
yarn add @otplib/plugin-base32-scure
```

## Overview

This plugin provides Base32 encoding and decoding using `@scure/base`, a cryptographic library which is audited and has comprehensive TypeScript support.

## Usage

### Basic Usage

```typescript
import { generateSecret, generate } from "otplib";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";

const base32 = new ScureBase32Plugin();
const crypto = new NodeCryptoPlugin();

// Generate a secret
const secret = generateSecret({ crypto, base32 });

// Generate a token
const token = await generate({
  secret,
  crypto,
  base32,
});
```

### Encoding and Decoding

```typescript
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const base32 = new ScureBase32Plugin();

// Encode binary data to Base32
const data = new Uint8Array([1, 2, 3, 4, 5]);
const encoded = base32.encode(data, { padding: true });
// Output: "AEBAGBAF"

// Decode Base32 string to binary
const decoded = base32.decode("AEBAGBAF");
// Output: Uint8Array [1, 2, 3, 4, 5]
```

### With Custom Options

```typescript
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const base32 = new ScureBase32Plugin();

// Encode without padding
const encoded = base32.encode(data, { padding: false });
// Output: "AEBAGBAF"

// Decode handles both padded and unpadded strings
const decoded1 = base32.decode("AEBAGBAF===="); // With padding
const decoded2 = base32.decode("AEBAGBAF"); // Without padding
```

## When to Use

Use this plugin when:

- You want an audited, security-focused implementation
- Performance is critical
- You need comprehensive input validation
- You're building security-critical applications
- You prefer libraries with active maintenance and security audits

## Platform Support

Works in all environments:

- Node.js (all versions)
- Browsers (Chrome, Firefox, Safari, Edge)
- Edge runtimes (Cloudflare Workers, Vercel Edge)
- Deno
- Bun

## Examples

### TOTP with Scure Base32

```typescript
import { generateSecret, generate } from "otplib";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";

const base32 = new ScureBase32Plugin();
const crypto = new NodeCryptoPlugin();

const secret = generateSecret({ crypto, base32 });
console.log(secret); // Base32-encoded secret

const token = await generate({ secret, crypto, base32 });
console.log(token); // 6-digit token
```

### Web Environment

```typescript
import { generateSecret, generate } from "otplib";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { WebCryptoPlugin } from "@otplib/plugin-crypto-web";

const base32 = new ScureBase32Plugin();
const crypto = new WebCryptoPlugin();

const secret = await generateSecret({ crypto, base32 });
const token = await generate({ secret, crypto, base32 });
```

### Manual Secret Generation

```typescript
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";

const base32 = new ScureBase32Plugin();
const crypto = new NodeCryptoPlugin();

// Generate random secret
const secretBytes = crypto.randomBytes(20);
const secret = base32.encode(secretBytes, { padding: false });

console.log(secret); // Base32 secret for TOTP
```

### Edge Runtime (Cloudflare Worker)

```typescript
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { WebCryptoPlugin } from "@otplib/plugin-crypto-web";

export default {
  async fetch(request) {
    const base32 = new ScureBase32Plugin();
    const crypto = new WebCryptoPlugin();

    // Generate secret
    const secretBytes = await crypto.randomBytes(20);
    const secret = base32.encode(secretBytes, { padding: false });

    return new Response(JSON.stringify({ secret }));
  },
};
```

## Advanced Usage

### Custom Validation

```typescript
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

const base32 = new ScureBase32Plugin();

function validateAndDecode(input: string): Uint8Array | null {
  try {
    // @scure/base validates:
    // - Character set (A-Z, 2-7)
    // - Length (must be multiple of 8 with padding, or correct without)
    // - Padding (if present, must be correct)
    return base32.decode(input);
  } catch (error) {
    console.error("Invalid Base32:", error.message);
    return null;
  }
}

const valid = validateAndDecode("JBSWY3DPEHPK3PXP");
const invalid = validateAndDecode("invalid@base32!");
```

### Integration with Other Libraries

```typescript
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { base32 as scureBase32 } from "@scure/base";

const plugin = new ScureBase32Plugin();

// Use plugin's convenience methods
const encoded = plugin.encode(data);

// Or use @scure/base directly for advanced options
const encoded = scureBase32.encode(data, { padding: false });
```

## Related Packages

- `@scure/base` - Audited encoding/decoding library
- `@otplib/core` - Core types and interfaces
- `@otplib/plugin-crypto-node` - Node.js crypto plugin
- `@otplib/plugin-crypto-web` - Web Crypto API plugin

## Documentation

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE) © 2026 Gerald Yeo
