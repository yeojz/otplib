---
"@otplib/plugin-base32-alt": minor
"@otplib/core": minor
"@otplib/hotp": minor
"@otplib/plugin-base32-scure": minor
"@otplib/plugin-crypto-noble": minor
"@otplib/plugin-crypto-node": minor
"@otplib/plugin-crypto-web": minor
"@otplib/preset-v11": minor
"@otplib/totp": minor
"@otplib/uri": minor
"@otplib/v12-adapter": minor
"otplib": minor
---

Add new `@otplib/plugin-base32-alt` package for alternative encoding plugins that bypass Base32. Includes `bypassAsString` for UTF-8 secrets, `bypassAsHex`/`bypassAsBase16` for hex-encoded secrets, `bypassAsBase64` for base64-encoded secrets, and `createBase32Plugin` factory for custom encodings. The `createBase32Plugin` factory now wraps encode/decode in try-catch to throw typed `Base32EncodeError`/`Base32DecodeError` with proper error chaining.
