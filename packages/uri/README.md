# @otplib/uri

Parse and generate `otpauth://` URIs for OTP account provisioning.

## Installation

```bash
npm install @otplib/uri
pnpm add @otplib/uri
yarn add @otplib/uri
```

## Overview

The `@otplib/uri` package provides utilities for working with `otpauth://` URIs - the standard format for sharing OTP account information. These URIs are commonly used in QR codes for authenticator app setup.

### URI Format

```
otpauth://TYPE/LABEL?PARAMETERS
```

- **TYPE**: `totp` or `hotp`
- **LABEL**: `issuer:account` or just `account`
- **PARAMETERS**: `secret`, `issuer`, `algorithm`, `digits`, `period`/`counter`

Example:

```
otpauth://totp/GitHub:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub
```

## Parsing URIs

### Basic Parsing

```typescript
import { parse } from "@otplib/uri";

const uri = "otpauth://totp/GitHub:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub";
const result = parse(uri);

console.log(result);
// {
//   type: 'totp',
//   label: 'GitHub:user@example.com',
//   params: {
//     secret: 'JBSWY3DPEHPK3PXP',
//     issuer: 'GitHub',
//     algorithm: 'sha1',
//     digits: 6,
//     period: 30
//   }
// }
```

### Extracting Account Details

```typescript
import { parse } from "@otplib/uri";

const uri = "otpauth://totp/ACME%20Corp:john@example.com?secret=JBSWY3DPEHPK3PXP";
const { label, params } = parse(uri);

// Split label to get issuer and account
const [issuer, account] = label.includes(":") ? label.split(":") : [params.issuer, label];

console.log("Issuer:", issuer); // 'ACME Corp'
console.log("Account:", account); // 'john@example.com'
console.log("Secret:", params.secret);
```

### Error Handling

```typescript
import {
  parse,
  URIParseError,
  InvalidURIError,
  MissingParameterError,
  InvalidParameterError,
} from "@otplib/uri";

try {
  const result = parse("invalid-uri");
} catch (error) {
  if (error instanceof InvalidURIError) {
    console.error("Not a valid otpauth:// URI");
  } else if (error instanceof MissingParameterError) {
    console.error("Missing required parameter (e.g., secret)");
  } else if (error instanceof InvalidParameterError) {
    console.error("Invalid parameter value");
  }
}
```

## Generating URIs

### TOTP URI

```typescript
import { generateTOTP } from "@otplib/uri";

const uri = generateTOTP({
  issuer: "ACME Corp",
  label: "john@example.com",
  secret: "JBSWY3DPEHPK3PXP",
});

console.log(uri);
// 'otpauth://totp/ACME%20Corp:john@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Corp'
```

### TOTP with Custom Options

```typescript
import { generateTOTP } from "@otplib/uri";

const uri = generateTOTP({
  issuer: "GitHub",
  label: "user@github.com",
  secret: "JBSWY3DPEHPK3PXP",
  algorithm: "sha256", // Non-default algorithm
  digits: 8, // 8-digit tokens
  period: 60, // 60-second period
});
```

### HOTP URI

```typescript
import { generateHOTP } from "@otplib/uri";

const uri = generateHOTP({
  issuer: "MyApp",
  label: "user123",
  secret: "JBSWY3DPEHPK3PXP",
  counter: 0, // Starting counter
});

console.log(uri);
// 'otpauth://hotp/MyApp:user123?secret=JBSWY3DPEHPK3PXP&issuer=MyApp&counter=0'
```

### Low-Level Generation

For more control, use the `generate` function directly:

```typescript
import { generate } from "@otplib/uri";

const uri = generate({
  type: "totp",
  label: "CustomApp:user@example.com",
  params: {
    secret: "JBSWY3DPEHPK3PXP",
    issuer: "CustomApp",
    algorithm: "sha1",
    digits: 6,
    period: 30,
  },
});
```

## Google Authenticator Compatibility

::: warning Google Authenticator Limitations
Google Authenticator has specific requirements:

- Only supports `sha1` algorithm
- Only supports `6` or `8` digits
- Only supports `30` second period for TOTP
- Issuer should be included in both label and parameter
  :::

### Compatible URI

```typescript
import { generateTOTP } from "@otplib/uri";

// This URI is fully compatible with Google Authenticator
const uri = generateTOTP({
  issuer: "MyService",
  label: "user@example.com",
  secret: "JBSWY3DPEHPK3PXP",
  // algorithm: 'sha1',  // Default, compatible
  // digits: 6,          // Default, compatible
  // period: 30,         // Default, compatible
});
```

## QR Code Integration

Generate a QR code for the URI using any QR library:

```typescript
import { generateTOTP } from "@otplib/uri";
import QRCode from "qrcode"; // Example library

const uri = generateTOTP({
  issuer: "MyApp",
  label: "user@example.com",
  secret: "JBSWY3DPEHPK3PXP",
});

// Generate QR code as data URL
const qrDataUrl = await QRCode.toDataURL(uri);

// Or generate as SVG
const qrSvg = await QRCode.toString(uri, { type: "svg" });
```

## Documentation

Full documentation available at [otplib.yeojz.dev](https://otplib.yeojz.dev):

- [Getting Started Guide](https://otplib.yeojz.dev/guide/getting-started)
- [API Reference](https://otplib.yeojz.dev/api/)

## License

[MIT](./LICENSE) © 2026 Gerald Yeo
