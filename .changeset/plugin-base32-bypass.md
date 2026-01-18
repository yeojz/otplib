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

Add new `@otplib/plugin-base32-bypass` package for raw string secrets, including string and custom bypass plugins, plus `createBase32Plugin`/`createCryptoPlugin` factories. Standardize v11/v12 adapters on `@scure/base` for stricter hex handling, update counterTolerance semantics with MAX_WINDOW set to 99, add `bytesToString`, and remove `hexToBytes` from `@otplib/core` public API.
