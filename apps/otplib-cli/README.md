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
otplib-cli [options] [command]
```

### Global Options

| Option               | Description                                 |
| -------------------- | ------------------------------------------- |
| `-h, --help`         | Show help                                   |
| `-V, --version`      | Show version                                |
| `-v, --vault <path>` | Vault file path (default: `./otplib.vault`) |

### Commands

| Command           | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `vault init`      | Create a new vault                                    |
| `vault update pw` | Update vault passphrase                               |
| `add`             | Add a new OTP entry (reads JSON from stdin)           |
| `list`            | List entries (interactive filter in TTY)              |
| `remove <id>`     | Remove an entry by ID                                 |
| `token <id>`      | Generate OTP code from vault entry                    |
| `token-file`      | Generate OTP from JSON or otpauth:// URI (from stdin) |

### Environment Variables

| Variable            | Description                                   |
| ------------------- | --------------------------------------------- |
| `OTPLIB_VAULT`      | Default vault name for path resolution        |
| `OTPLIB_PASSPHRASE` | Vault passphrase (required for non-TTY usage) |

## Examples

### Create a new vault

```bash
otplib-cli vault init
# Prompts for new passphrase and confirmation
# Output: Vault created: ./otplib.vault
```

### Update vault passphrase

```bash
otplib-cli vault update pw
# Prompts for current passphrase, then new passphrase with confirmation
```

### Add an entry

The `add` command reads JSON from stdin with the following fields:

| Field       | Type   | Required | Default | Description                         |
| ----------- | ------ | -------- | ------- | ----------------------------------- |
| `secret`    | string | Yes      | -       | Base32-encoded secret               |
| `label`     | string | Yes      | -       | Entry label                         |
| `type`      | string | No       | `totp`  | `totp` or `hotp`                    |
| `issuer`    | string | No       | -       | Issuer name                         |
| `digits`    | number | No       | `6`     | OTP digits (6, 7, or 8)             |
| `algorithm` | string | No       | `sha1`  | Hash algorithm (sha1/sha256/sha512) |
| `period`    | number | No       | `30`    | TOTP period in seconds              |
| `counter`   | number | No       | `0`     | HOTP counter                        |

```bash
# Interactive (prompts for passphrase)
echo '{"secret":"GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ","label":"GitHub:user@example.com"}' | otplib-cli add
# Output: a1b2c3d4e5f6g7h8

# Non-interactive
echo '{"secret":"GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ","label":"GitHub","issuer":"GitHub"}' | OTPLIB_PASSPHRASE=mypass otplib-cli add

# With custom settings
echo '{"secret":"ABC123","label":"Custom","type":"totp","digits":8,"algorithm":"sha256","period":60}' | otplib-cli add
```

### List entries

```bash
# Non-interactive (pipes, scripts)
OTPLIB_PASSPHRASE=mypass otplib-cli list
# Output:
# a1b2c3d4e5f6g7h8	GitHub:user@example.com
# b2c3d4e5f6g7h8i9	AWS:admin (Amazon)

# Interactive (TTY) - shows filterable list
otplib-cli list
# Use arrow keys to navigate, type to filter
# Press Enter to copy OTP, Tab to copy UID, Escape to cancel
```

### Generate OTP from vault

```bash
# Output to stdout (no trailing newline for piping)
OTPLIB_PASSPHRASE=mypass otplib-cli token a1b2c3d4e5f6g7h8
# Output: 123456
```

### Generate OTP from file/stdin (ad-hoc)

The `token-file` command generates OTP codes without storing secrets in the vault. It accepts either JSON or `otpauth://` URIs from stdin.

```bash
# From JSON
echo '{"secret":"GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"}' | otplib-cli token-file
# Output: 123456

# From otpauth:// URI
echo 'otpauth://totp/GitHub:user?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=GitHub' | otplib-cli token-file
# Output: 123456

# From a file
cat secret.json | otplib-cli token-file
```

JSON fields for `token-file`:

| Field       | Type   | Required | Default | Description                         |
| ----------- | ------ | -------- | ------- | ----------------------------------- |
| `secret`    | string | Yes      | -       | Base32-encoded secret               |
| `type`      | string | No       | `totp`  | `totp` or `hotp`                    |
| `digits`    | number | No       | `6`     | OTP digits (6, 7, or 8)             |
| `algorithm` | string | No       | `sha1`  | Hash algorithm (sha1/sha256/sha512) |
| `period`    | number | No       | `30`    | TOTP period in seconds              |
| `counter`   | number | No       | `0`     | HOTP counter                        |

### Pipe to clipboard (macOS)

```bash
OTPLIB_PASSPHRASE=mypass otplib-cli token a1b2c3d4e5f6g7h8 | pbcopy
```

### Pipe to clipboard (Linux with xclip)

```bash
OTPLIB_PASSPHRASE=mypass otplib-cli token a1b2c3d4e5f6g7h8 | xclip -selection clipboard
```

### Use different vault files

```bash
# Work vault
OTPLIB_PASSPHRASE=workpass otplib-cli --vault ./work.vault list

# Personal vault
OTPLIB_PASSPHRASE=personalpass otplib-cli --vault ~/personal.vault list

# Or via environment
OTPLIB_VAULT=work OTPLIB_PASSPHRASE=workpass otplib-cli list
```

### Remove an entry

```bash
OTPLIB_PASSPHRASE=mypass otplib-cli remove a1b2c3d4e5f6g7h8
# Output: Removed
```

## Interactive Mode

When running in a TTY, the `list` command provides an interactive interface:

- **Arrow keys**: Navigate entries
- **Type**: Filter entries by label, ID, or issuer
- **Enter**: Copy OTP code to clipboard
- **Tab**: Copy entry UID to clipboard
- **Escape**: Cancel

## Security

- Secrets are encrypted with AES-256-GCM
- Vault passphrase is derived using scrypt (N=16384, r=8, p=1)
- Each entry is individually encrypted with a Data Encryption Key (DEK)
- The DEK is wrapped with a Key Encryption Key (KEK) derived from your passphrase
- Index metadata (labels, not secrets) is also encrypted

## License

[MIT](./LICENSE)
