---
"otplib-cli": major
---

Complete rewrite of otplib-cli as a stateless CLI tool

- Two commands: `otplib` (core stateless CLI) and `otplibx` (dotenvx wrapper)
- Supports TOTP/HOTP generation, verification, and otpauth URI parsing
- Integrates with dotenvx for encrypted secret storage
- Composable with external tools (fzf, password managers, etc.)
