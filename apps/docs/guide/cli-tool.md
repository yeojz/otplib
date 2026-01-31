# Command Line Tool (CLI)

The `otplib-cli` package provides two CLI tools for generating and managing OTP tokens directly from your terminal.

::: info Use Case
In environments where OTP access is needed - such as CI/CD pipelines, automated scripts, or headless servers - you can provide a small, scoped encrypted env file containing only the necessary OTP secrets. This enables secure, programmatic access to 2FA tokens without exposing your full authenticator vault.
:::

## Installation

After installation, two commands are available:

- **`otplibx`** - Integrated with [dotenvx](https://github.com/dotenvx/dotenvx) for encrypted secret storage.
- **`otplib`** - Stateless CLI that reads from stdin and writes to stdout. Designed for scripting and integration with other secret managers.

```bash
# Global install
npm install -g otplib-cli
otplibx --help
otplib --help

# Run as needed (no install required)
npx -p otplib-cli otplibx --help
npx -p otplib-cli otplib --help
```

## Architecture

The CLI is designed around two key principles:

### Separation of Concerns

OTP generation and secret storage are intentionally decoupled.

- **`otplib`** handles OTP logic (generation, verification, validation)
- **`dotenvx`** handles storage security (encryption, key management)
- **`otplibx`** orchestrates both for convenience

```
   dotenvx    ──▸   otplib    ──▸   dotenvx
  (decrypt)        (process)       (encrypt)

```

### Why Delegate Storage to dotenvx?

Rather than implementing our own encryption, we defer to [dotenvx](https://dotenvx.com/) - an established tool for managing encrypted environment files. This approach:

1. **Reduces attack surface** - We don't roll our own crypto
2. **Leverages existing tooling** - dotenvx has its own ecosystem and key management
3. **Enables flexibility** - Use `otplib` directly with Vault, AWS Secrets Manager, or any other backend following our JSON output

The core `otplib` CLI is stateless - it transforms data without storing anything. This makes it composable with any secret management solution.

## Getting Started (otplibx)

For most cases, `otplibx` would be the easiest way to get started with the CLI. It acts as a wrapper around the core `otplib` CLI and automatically handles encryption and storage using [dotenvx](https://dotenvx.com/).

### Commands

| Command                      | Description                               |
| ---------------------------- | ----------------------------------------- |
| `init [file]`                | Initialize encrypted secrets file         |
| `add [-b, --bytes <n>]`      | Add OTP entry (reads from stdin)          |
| `token [-n] [id]`            | Generate OTP token (ID from arg or stdin) |
| `type [-n] [id]`             | Output entry type (totp or hotp)          |
| `verify <id> <token>`        | Verify a token (exit 0=valid, 1=invalid)  |
| `list [--filter <query>]`    | List entries (fuzzy filter by ID/label)   |
| `guard update <key> <value>` | Add or update a guardrail value           |
| `guard rm <key>`             | Remove an overridden guardrail            |
| `guard show`                 | Show guardrail configuration              |

**Options:**

- `-f, --file <path>` — Secrets file (default: `.env.otplibx`)
- `-n, --no-newline` — Omit trailing newline (token command)

### Initialization

First, initialize a secrets file in your current directory.

```bash
npx -p otplib-cli otplibx init
# OR if installed globally
otplibx init

# Use a custom filename
otplibx init .env.otp
```

This creates `.env.otplibx` (or your custom filename) to store encrypted secrets, along with a `.env.keys` file containing the encryption key.

::: warning
**Never commit `.env.keys` to version control.** This file contains your encryption key. Add it to `.gitignore`:

```bash
echo ".env.keys" >> .gitignore
```

:::

### Adding an Account

You can add an account using an `otpauth://` URI (often found in QR code data) or a JSON object.

**Sample `otp-uri.txt`:**

```
otpauth://totp/GitHub:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub
```

**Or as JSON (`otp-entry.json`):**

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "issuer": "GitHub",
  "account": "user@example.com"
}
```

```bash
# From a file containing the otpauth URI
cat otp-uri.txt | otplibx add

# From a JSON file
cat otp-entry.json | otplibx add

# From clipboard (macOS)
pbpaste | otplibx add
```

The command will output a Unique ID (UID) for the new entry, e.g., `A1B2C3D4`.

::: tip
Avoid using `echo` with secrets as they may be logged in shell history. Use files, clipboard, or redirect from a secure source instead.
:::

### Generating Tokens

To generate a token, use the `token` command with the Entry ID.

```bash
otplibx token A1B2C3D4
# Output: 123456

# Omit trailing newline (useful for piping)
otplibx token -n A1B2C3D4 | pbcopy
```

### Listing Accounts

List your OTP entries with optional fuzzy filtering.

```bash
# List all entries (tab-separated: label, id, type)
otplibx list

# Filter entries by keyword
otplibx list --filter github
```

For interactive selection, pipe to `fzf`:

```bash
# Select entry interactively and copy token
otplibx list | fzf | cut -f2 | otplibx token -n | pbcopy
```

### Guardrails

Guardrails prevent the creation or use of insecure secrets (e.g., secrets that are too short).

```bash
# View current guardrails
otplibx guard show

# Update a guardrail (e.g., enforce minimum 20 bytes secret)
otplibx guard update MIN_SECRET_BYTES 20

# Remove a overridden guardrail (revert to default)
otplibx guard rm MIN_SECRET_BYTES
```

## Core CLI (otplib)

For power users and scripting, the `otplib` command provides a pure stateless interface. It reads from `stdin` and writes to `stdout`, making it composable with any secret manager.

::: warning All commands require stdin
The `otplib` CLI is fully stateless — it stores nothing and reads nothing from disk. Every command reads its input from stdin:

- **`encode`** reads an otpauth URI or JSON
- **All other commands** read the JSON secrets object

This design enables integration with any secret manager or storage backend.
:::

### Input Format

The `otplib` CLI expects a JSON object where:

- **Keys**: Unique identifiers for your entries (e.g., `A1B2C3D4`)
- **Values**: Base64-encoded JSON payloads containing the secret and configuration

**Payload Structure (before Base64 encoding):**

```json
{
  "data": {
    "type": "totp",
    "secret": "JBSWY3DPEHPK3PXP",
    "issuer": "Service",
    "algorithm": "SHA1",
    "digits": 6,
    "period": 30
  }
}
```

### Commands

All commands read from stdin. The `encode` command reads an otpauth URI or JSON; all others read the JSON secrets object.

| Command                                        | Description                                              |
| ---------------------------------------------- | -------------------------------------------------------- |
| `encode [-b, --bytes <n>] [--save-uid <file>]` | Encode otpauth URI or JSON into internal format with UID |
| `list [-f, --filter <query>]`                  | List entries (fuzzy filter by ID/label)                  |
| `token [-n] <id>`                              | Generate OTP token (auto-detects TOTP/HOTP)              |
| `type [-n] <id>`                               | Output entry type (totp or hotp)                         |
| `hotp update-counter <id> [n]`                 | Update HOTP counter (outputs updated entry)              |
| `verify <id> <token>`                          | Verify a token (exit code 0=valid, 1=invalid)            |
| `guard show`                                   | Show guardrail configuration                             |

### Examples

**Sample `storage.json`:**

```json
{
  "A1B2C3D4": "eyJkYXRhIjp7InR5cGUiOiJ0b3RwIiwic2VjcmV0IjoiSkJTV1kzRFBFSFBLM1BYUCIsImlzc3VlciI6IlNlcnZpY2UiLCJhbGdvcml0aG0iOiJTSEExIiwiZGlnaXRzIjo2LCJwZXJpb2QiOjMwfX0="
}
```

```bash
# Read JSON input from a file
cat storage.json | otplib list
# Output: Service	A1B2C3D4	totp

# Generate a token
cat storage.json | otplib token A1B2C3D4
# Output: 123456

# Verify a token
cat storage.json | otplib verify A1B2C3D4 123456 && echo "valid" || echo "invalid"

# Encode a new entry from file (outputs KEY=value)
cat otp-uri.txt | otplib encode
# Output: A1B2C3D4=eyJkYXRhIjp7...}}

# Encode with custom byte length for longer UIDs
cat otp-uri.txt | otplib encode --bytes 8
# Output: A1B2C3D4E5F6G7H8=eyJkYXRhIjp7...}}

# Encode from clipboard and save the generated UID
pbpaste | otplib encode --save-uid uids.txt
```

## Other Secret Managers

The core `otplib` CLI is stateless and works with any secret manager that can output JSON to stdout. Here are examples of integrating with popular password managers.

:::danger Note
Please refer to their respective password manager's documentation as their commands may have changed.
The examples below are here to serve as a rough guide.
:::

### 1Password CLI

Use the [1Password CLI](https://developer.1password.com/docs/cli/) to retrieve OTP secrets and pipe them to `otplib`.

```bash
# Store your OTP payload in 1Password as a secure note or custom field
# Then retrieve and pipe to otplib

# Example: Get a secret stored in 1Password and generate a token
op read "op://Vault/MyOTPSecrets/otplib-data" | otplib token A1B2C3D4
```

### Bitwarden CLI

Use the [Bitwarden CLI](https://bitwarden.com/help/cli/) to retrieve secrets.

```bash
# Unlock Bitwarden first
export BW_SESSION=$(bw unlock --raw)

# Retrieve your OTP data stored in Bitwarden
bw get item "OTP Secrets" | jq -r '.notes' | otplib token A1B2C3D4
```

### HashiCorp Vault

```bash
# Retrieve from Vault and pipe to otplib
vault kv get -format=json secret/otp-secrets | jq '.data.data' | otplib token A1B2C3D4
```

### AWS Secrets Manager

```bash
# Retrieve from AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id otp-secrets \
  --query SecretString --output text | otplib token A1B2C3D4
```

## Security Notes

- **Storage security**: Secret storage security depends entirely on your chosen secret manager - ensure it is set up correctly for your threat model.
- **Clipboard exposure**: Copy commands using `pbcopy` or `xclip` may expose tokens via clipboard history. Consider disabling clipboard history when working with sensitive tokens.
- **HOTP atomicity**: Counter updates for HOTP entries are not atomic. Avoid concurrent updates to the same HOTP entry from multiple processes.
- **Guardrails**: By default, secrets shorter than 16 bytes or longer than 64 bytes are rejected. Use `guard update` to modify these limits if needed, but understand the security implications.
