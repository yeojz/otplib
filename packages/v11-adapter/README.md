# @otplib/preset-v11

> v11 compatibility preset for otplib

## Installation

```bash
npm install @otplib/preset-v11
```

## Usage

This package provides a drop-in replacement for `otplib` v11, using the v13 core.

```javascript
import { authenticator, hotp, totp } from "@otplib/preset-v11";

const secret = authenticator.generateSecret();
const token = authenticator.generate(secret);
const isValid = authenticator.check(token, secret);
```

## Compatibility Notes

- **Epoch**: Uses seconds (UNIX timestamp), same as v11.
- **Error Handling**: `check` and `verify` methods swallow errors and return `false`, matching v11 behavior.
- **Secret Length**: Enforces strict secret length (> 16 bytes) due to v13 core security requirements.

## License

MIT
