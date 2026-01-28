# otplib-cli

A stateless CLI tool for OTP operations.

Pair with [dotenvx](https://github.com/dotenvx/dotenvx) for encrypted storage.
The CLI transforms data while dotenvx handles storage and encryption.

## Installation

```bash
# Global install (recommended)
npm install -g otplib-cli

# Or use npx without installing
npx otplib --help
npx otplibx --help
```

After installation, two commands are available:

- **`otplib`** - UNIX-style CLI (stdin/stdout, composable)
- **`otplibx`** - Convenience wrapper for dotenvx integration

## Quick Start with otplibx

`otplibx` is the easiest way to get started - it handles dotenvx integration automatically.

```bash
# Initialize your secrets file
otplibx init

# Add an OTP entry
echo 'otpauth://totp/GitHub:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub' | otplibx add
# Output: V1_A1B2C3D4E5F6G7H8

# Generate a token
otplibx token V1_A1B2C3D4E5F6G7H8

# List all entries (interactive)
otplibx list
```

### otplibx Commands

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `otplibx init [file]` | Initialize encrypted secrets file  |
| `otplibx add`         | Add OTP entry (reads from stdin)   |
| `otplibx token <id>`  | Generate OTP token                 |
| `otplibx list`        | Interactive list/search of entries |

### otplibx Options

| Option              | Description                            |
| ------------------- | -------------------------------------- |
| `-f, --file <path>` | Secrets file (default: `.env.otplibx`) |
| `-h, --help`        | Show help                              |
| `-v, --version`     | Show version                           |

### Environment Variables

| Variable       | Description                                    |
| -------------- | ---------------------------------------------- |
| `OTPLIBX_FILE` | Default secrets file (default: `.env.otplibx`) |

---

## UNIX-style CLI (otplib)

For power users who want full control, `otplib` is a pure UNIX-style tool that reads from stdin and writes to stdout.

### Architecture

```
dotenvx get --all → otplib (transform) → dotenvx set
```

- Storage and encryption are delegated to dotenvx
- Input is JSON from stdin (via `dotenvx get --all`)
- Output is `KEY=value` format for dotenvx

### Commands

| Command                        | Description                                   |
| ------------------------------ | --------------------------------------------- |
| `add`                          | Add new OTP entry (reads from stdin)          |
| `list`                         | Interactive list/search of entries            |
| `totp token <id>`              | Generate TOTP token                           |
| `hotp token <id>`              | Generate HOTP token                           |
| `hotp update-counter <id> [n]` | Update HOTP counter                           |
| `verify <id> <token>`          | Verify a token (exit code 0=valid, 1=invalid) |

### Examples

#### Add an entry

```bash
# From otpauth URI
OUTPUT=$(echo 'otpauth://totp/GitHub:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub' | otplib add)
KEY=$(echo "$OUTPUT" | cut -d= -f1)
VALUE=$(echo "$OUTPUT" | cut -d= -f2)
dotenvx set -f .env.otplibx "$KEY" "$VALUE"

# From JSON
OUTPUT=$(echo '{"secret":"JBSWY3DPEHPK3PXP","issuer":"GitHub","account":"user@example.com"}' | otplib add)
KEY=$(echo "$OUTPUT" | cut -d= -f1)
VALUE=$(echo "$OUTPUT" | cut -d= -f2)
dotenvx set -f .env.otplibx "$KEY" "$VALUE"
```

#### Generate tokens

```bash
# TOTP
dotenvx get --all -f .env.otplibx | otplib totp token V1_A1B2C3D4E5F6G7H8

# HOTP
dotenvx get --all -f .env.otplibx | otplib hotp token V1_A1B2C3D4E5F6G7H8
```

#### List entries

```bash
# Interactive mode (TTY)
dotenvx get --all -f .env.otplibx | otplib list

# Non-interactive mode (pipes)
dotenvx get --all -f .env.otplibx | otplib list | head -5
# Output:
# V1_A1B2C3D4E5F6G7H8	totp	GitHub:user@example.com
# V1_B2C3D4E5F6G7H8I9	hotp	AWS:admin
```

**Interactive controls:**

- **Type**: Filter entries
- **Up/Down or j/k**: Navigate
- **`u`**: Copy UID to clipboard
- **`o`**: Copy OTP to clipboard
- **Escape**: Cancel

#### Update HOTP counter

```bash
# Increment by 1
OUTPUT=$(dotenvx get --all -f .env.otplibx | otplib hotp update-counter V1_A1B2C3D4E5F6G7H8)
KEY=$(echo "$OUTPUT" | cut -d= -f1)
VALUE=$(echo "$OUTPUT" | cut -d= -f2)
dotenvx set -f .env.otplibx "$KEY" "$VALUE"

# Set to specific value
OUTPUT=$(dotenvx get --all -f .env.otplibx | otplib hotp update-counter V1_A1B2C3D4E5F6G7H8 10)
KEY=$(echo "$OUTPUT" | cut -d= -f1)
VALUE=$(echo "$OUTPUT" | cut -d= -f2)
dotenvx set -f .env.otplibx "$KEY" "$VALUE"
```

#### Verify a token

```bash
dotenvx get --all -f .env.otplibx | otplib verify V1_A1B2C3D4E5F6G7H8 123456 \
  && echo "valid" || echo "invalid"
```

#### Copy to clipboard

```bash
# macOS
dotenvx get --all -f .env.otplibx | otplib totp token V1_A1B2C3D4E5F6G7H8 | pbcopy

# Linux (xclip)
dotenvx get --all -f .env.otplibx | otplib totp token V1_A1B2C3D4E5F6G7H8 | xclip -selection clipboard
```

---

## Data Format

Entries are stored as `V1_<UID>=<base64-json-payload>` in your secrets file.

- `V1_` prefix indicates format version (for future migrations)
- `<UID>` is a 16-character uppercase hex string
- Payload is base64-encoded JSON

**Payload structure:**

```json
{
  "data": {
    "type": "totp",
    "secret": "JBSWY3DPEHPK3PXP",
    "issuer": "GitHub",
    "account": "user@example.com",
    "algorithm": "SHA1",
    "digits": 6,
    "period": 30
  }
}
```

**JSON input fields for `add`:**

| Field       | Type   | Required | Default | Description                         |
| ----------- | ------ | -------- | ------- | ----------------------------------- |
| `secret`    | string | Yes      | -       | Base32-encoded secret               |
| `type`      | string | No       | `totp`  | `totp` or `hotp`                    |
| `issuer`    | string | No       | -       | Issuer name                         |
| `account`   | string | No       | -       | Account name                        |
| `digits`    | number | No       | `6`     | OTP digits (6, 7, or 8)             |
| `algorithm` | string | No       | `SHA1`  | Hash algorithm (SHA1/SHA256/SHA512) |
| `period`    | number | No       | `30`    | TOTP period in seconds              |
| `counter`   | number | No       | `0`     | HOTP counter                        |

---

## Security Notes

- **Storage security**: Relies on dotenvx encryption (AES-GCM)
- **Clipboard exposure**: Copy actions may leak secrets via clipboard history
- **HOTP atomicity**: Counter updates are not atomic; avoid concurrent updates to the same HOTP entry

## License

[MIT](./LICENSE)
