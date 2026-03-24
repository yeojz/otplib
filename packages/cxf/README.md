# @otplib/cxf

Read and write OTP credentials from [FIDO Alliance Credential Exchange Format (CXF)](https://fidoalliance.org/specs/cx/cxf-v1.0-rd-20250313.html) documents.

## Scope

This package handles the **TOTP/HOTP subset** of CXF. It does not implement the full CXF spec or the CXP transport protocol. Non-OTP credential types (passkeys, passwords, SSH keys, etc.) are silently skipped during parsing.

## Installation

```bash
npm install @otplib/cxf @otplib/core
```

## Usage

### Parsing a CXF document

```typescript
import { fromCXF } from "@otplib/cxf";

// From a parsed JSON object or JSON string
const accounts = fromCXF(cxfDocument);

for (const account of accounts) {
  console.log(account.type); // 'totp' or 'hotp'
  console.log(account.secret); // Base32 encoded
  console.log(account.name); // e.g. 'user@example.com'
  console.log(account.issuer); // e.g. 'GitHub'
}
```

### Creating a CXF document

```typescript
import { toCXF } from "@otplib/cxf";
import type { OTPAccount } from "@otplib/core";

const accounts: OTPAccount[] = [
  {
    type: "totp",
    secret: "JBSWY3DPEHPK3PXP",
    name: "user@example.com",
    issuer: "GitHub",
    algorithm: "sha1",
    digits: 6,
    period: 30,
  },
];

const doc = toCXF(accounts);
const json = JSON.stringify(doc, null, 2);
```

### Combining with @otplib/uri

```typescript
import { fromCXF } from "@otplib/cxf";
import { generateURIFromAccount } from "@otplib/uri";

const accounts = fromCXF(cxfDocument);

// Convert each account to an otpauth:// URI (e.g. for QR codes)
const uris = accounts.map(generateURIFromAccount);
```

## API

### `fromCXF(input, options?)`

Extract `OTPAccount` entries from a CXF document. Accepts a parsed object or JSON string. Throws on invalid document structure.

### `toCXF(accounts, options?)`

Wrap `OTPAccount` entries into a CXF document. Returns a plain object — call `JSON.stringify()` to serialize.

## License

MIT
