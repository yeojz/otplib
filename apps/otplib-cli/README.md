# otplib-cli

A CLI tool for managing encrypted OTP vaults. Stores TOTP/HOTP secrets in encrypted vault files using AES-256-GCM with scrypt key derivation.

## Installation

```bash
# From the monorepo
pnpm --filter @repo/otplib-cli build

# Run directly
node apps/otplib-cli/dist/index.cjs --help
```

## Usage

```bash
otplib-cli [command] [options] [args]
```

### Commands

| Command                | Description                        |
| ---------------------- | ---------------------------------- |
| `add <secret> <label>` | Add a new TOTP entry               |
| `list`                 | List all entries (without secrets) |
| `remove <id>`          | Remove an entry by ID              |
| `otp <id>`             | Generate OTP code for an entry     |

### Options

| Option               | Description                             |
| -------------------- | --------------------------------------- |
| `-h, --help`         | Show help                               |
| `-V, --version`      | Show version                            |
| `-v, --vault <name>` | Specify vault name (default: `default`) |

### Environment Variables

| Variable            | Description                                   |
| ------------------- | --------------------------------------------- |
| `OTPLIB_VAULT`      | Default vault name                            |
| `OTPLIB_PASSPHRASE` | Vault passphrase (required for non-TTY usage) |

## Examples

### Add an entry

```bash
# Interactive (prompts for passphrase)
otplib-cli add GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ "GitHub:user@example.com"

# Non-interactive
OTPLIB_PASSPHRASE=mypass otplib-cli add GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ "GitHub:user@example.com"
# Output: a1b2c3d4e5f6g7h8
```

### List entries

```bash
OTPLIB_PASSPHRASE=mypass otplib-cli list
# Output:
# a1b2c3d4e5f6g7h8	GitHub:user@example.com
# b2c3d4e5f6g7h8i9	AWS:admin
```

### Generate OTP

```bash
OTPLIB_PASSPHRASE=mypass otplib-cli otp a1b2c3d4e5f6g7h8
# Output: 123456
```

### Pipe to clipboard (macOS)

```bash
OTPLIB_PASSPHRASE=mypass otplib-cli otp a1b2c3d4e5f6g7h8 | pbcopy
```

### Pipe to clipboard (Linux with xclip)

```bash
OTPLIB_PASSPHRASE=mypass otplib-cli otp a1b2c3d4e5f6g7h8 | xclip -selection clipboard
```

### Use multiple vaults

```bash
# Work vault
OTPLIB_PASSPHRASE=workpass otplib-cli --vault work list

# Personal vault
OTPLIB_PASSPHRASE=personalpass otplib-cli --vault personal list

# Or via environment
OTPLIB_VAULT=work OTPLIB_PASSPHRASE=workpass otplib-cli list
```

### Remove an entry

```bash
OTPLIB_PASSPHRASE=mypass otplib-cli remove a1b2c3d4e5f6g7h8
# Output: Removed
```

## Vault Storage

Vaults are stored in OS-specific config directories:

| OS      | Path                                                           |
| ------- | -------------------------------------------------------------- |
| Linux   | `~/.config/otplib-cli/vaults/<name>.vault`                     |
| macOS   | `~/Library/Application Support/otplib-cli/vaults/<name>.vault` |
| Windows | `%APPDATA%/otplib-cli/vaults/<name>.vault`                     |

## Security

- Secrets are encrypted with AES-256-GCM
- Vault passphrase is derived using scrypt (N=16384, r=8, p=1)
- Each entry is individually encrypted with a Data Encryption Key (DEK)
- The DEK is wrapped with a Key Encryption Key (KEK) derived from your passphrase
- Index metadata (labels, not secrets) is also encrypted

## License

MIT
