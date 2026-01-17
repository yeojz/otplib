---
"@otplib/plugin-base32-bypass": minor
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

Add new `@otplib/plugin-base32-bypass` package for using raw string secrets without Base32 encoding. Includes `StringBypassPlugin` for UTF-8 strings and `BypassBase32Plugin` for custom transformations. Standardize adapters (v11/v12) on `@scure/base` for improved hex input validation. Add `bytesToString` utility to `@otplib/core`. Remove `hexToBytes` from `@otplib/core` public API.
