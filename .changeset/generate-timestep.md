---
"@otplib/totp": major
---

Add `timeStep` to TOTP generation function return values. `generate()` and `generateSync()` now return `{ token, timeStep }` instead of just the token string. TOTP class methods updated accordingly. Maintains backward compatibility in v11/v12 adapters and functional API.
