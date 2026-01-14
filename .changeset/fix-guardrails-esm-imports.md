---
"@otplib/core": patch
"@otplib/hotp": patch
"@otplib/totp": patch
"@otplib/uri": patch
"@otplib/preset-v11": patch
"@otplib/v12-adapter": patch
"@otplib/plugin-base32-scure": patch
"@otplib/plugin-crypto-noble": patch
"@otplib/plugin-crypto-node": patch
"@otplib/plugin-crypto-web": patch
"otplib": patch
---

Fix guardrails parameter passing and standardize ESM imports

**Bug Fixes:**

- Fixed guardrails parameter not being passed through HOTP and TOTP generate functions
- Ensured guardrails propagate correctly through the entire call chain in functional API

**Internal Changes:**

- Standardized all relative imports to use explicit `.js` extensions for ESM compatibility across Node.js 20+, Bun, Deno, and browser environments
- Added `@otplib/plugin-base32-scure` as dev dependency to `@otplib/hotp` for test requirements
