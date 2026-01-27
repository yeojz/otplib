# otplib-cli

A stateless CLI tool for OTP operations. Designed to work with [dotenvx](https://dotenvx.com/) for encrypted storage - the CLI transforms data while dotenvx handles storage and encryption.

## Architecture

The CLI is a **stateless data transformer**:

```
dotenvx get --all → otplib-cli (transform) → dotenvx set
```

- Storage and encryption are delegated to dotenvx
- Input is JSON from stdin (via `dotenvx get --all`)
- Output is `key=value` format for `dotenvx set`

## Installation

```bash
# From the monorepo
pnpm --filter @repo/otplib-cli build

# Run directly
node apps/otplib-cli/dist/index.cjs --help
```

## Usage

```bash
otplib-cli [command]
```

### Commands

| Command                        | Description                                   |
| ------------------------------ | --------------------------------------------- |
| `add`                          | Add new OTP entry (reads from stdin)          |
| `list`                         | Interactive list/search of entries            |
| `totp token <id>`              | Generate TOTP token                           |
| `hotp token <id>`              | Generate HOTP token                           |
| `hotp update-counter <id> [n]` | Update HOTP counter                           |
| `verify <id> <token>`          | Verify a token (exit code 0=valid, 1=invalid) |

### Options

| Option          | Description  |
| --------------- | ------------ |
| `-h, --help`    | Show help    |
| `-V, --version` | Show version |

## Data Format

Entries are stored as `<uid>=<base64-json-payload>` in a `.secrets.otp` file managed by dotenvx.

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

## Examples

### Setup

```bash
# Create and encrypt a secrets file
touch .secrets.otp
dotenvx encrypt -f .secrets.otp
```

### Add an entry

The `add` command accepts either **otpauth:// URIs** or **JSON** from stdin:

```bash
# From otpauth URI
echo 'otpauth://totp/GitHub:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub' \
  | otplib-cli add \
  | dotenvx set -f .secrets.otp

# From JSON
echo '{"secret":"JBSWY3DPEHPK3PXP","issuer":"GitHub","account":"user@example.com"}' \
  | otplib-cli add \
  | dotenvx set -f .secrets.otp
```

**JSON input fields:**

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

**Save UID to file:**

```bash
echo 'otpauth://totp/Test?secret=ABC' \
  | otplib-cli add --save-uid=uids.txt \
  | dotenvx set -f .secrets.otp
```

### List entries

```bash
# Interactive mode (TTY)
dotenvx get --all -f .secrets.otp | otplib-cli list

# Non-interactive mode (pipes)
dotenvx get --all -f .secrets.otp | otplib-cli list
# Output:
# a1b2c3d4e5f6g7h8	totp	GitHub:user@example.com
# b2c3d4e5f6g7h8i9	hotp	AWS:admin
```

**Interactive controls:**

- **Type**: Filter entries
- **Up/Down or j/k**: Navigate
- **`u`**: Copy UID to clipboard
- **`o`**: Copy OTP to clipboard
- **Escape**: Cancel

### Generate TOTP token

```bash
dotenvx get --all -f .secrets.otp | otplib-cli totp token a1b2c3d4e5f6g7h8
# Output: 123456 (no trailing newline)
```

### Generate HOTP token

```bash
dotenvx get --all -f .secrets.otp | otplib-cli hotp token i9j0k1l2m3n4o5p6
# Output: 789012
```

### Update HOTP counter

```bash
# Increment by 1
dotenvx get --all -f .secrets.otp \
  | otplib-cli hotp update-counter i9j0k1l2m3n4o5p6 \
  | dotenvx set -f .secrets.otp

# Set to specific value
dotenvx get --all -f .secrets.otp \
  | otplib-cli hotp update-counter i9j0k1l2m3n4o5p6 10 \
  | dotenvx set -f .secrets.otp
```

### Verify a token

```bash
dotenvx get --all -f .secrets.otp | otplib-cli verify a1b2c3d4e5f6g7h8 123456 \
  && echo "valid" || echo "invalid"

# In scripts
if dotenvx get --all -f .secrets.otp | otplib-cli verify "$id" "$token"; then
  echo "Access granted"
fi
```

### Convenience alias

```bash
alias otp='dotenvx get --all -f .secrets.otp | otplib-cli'

otp list
otp totp token a1b2c3d4e5f6g7h8
otp verify a1b2c3d4e5f6g7h8 123456
```

### Copy to clipboard

```bash
# macOS
dotenvx get --all -f .secrets.otp | otplib-cli totp token a1b2c3d4e5f6g7h8 | pbcopy

# Linux (xclip)
dotenvx get --all -f .secrets.otp | otplib-cli totp token a1b2c3d4e5f6g7h8 | xclip -selection clipboard
```

## Security Notes

- **Storage security**: Relies on dotenvx encryption (AES-GCM)
- **Clipboard exposure**: Copy actions may leak secrets via clipboard history
- **HOTP atomicity**: Counter updates are not atomic; avoid concurrent updates to the same HOTP entry

## License

[MIT](./LICENSE)
