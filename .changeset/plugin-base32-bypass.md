---
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

Add new `@otplib/plugin-base32-bypass` package for using raw string or hex-encoded secrets without Base32 encoding. Standardize adapters (v11/v12) on `@scure/base` for improved hex input validation. Remove `hexToBytes` from `@otplib/core` public API.
