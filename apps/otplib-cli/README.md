# otplib-cli

A Command Line tool for OTP operations.

Uses AES-256-GCM authenticated encryption for secure secret storage.

## Installation

```bash
npm install -g otplib-cli
```

Two commands are available:

- **`otplibx`** - Includes built-in encryption for secure storage (recommended)
- **`otplib`** - Stateless CLI for scripting and custom backends

## Quick Start

### otplibx

```bash
# Initialize secrets file
otplibx init

# Add entry from file or clipboard
cat otp-uri.txt | otplibx add
pbpaste | otplibx add

# Generate token
otplibx token A1B2C3D4

# List entries
otplibx list
otplibx list --filter github

# Interactive selection with fzf
npx otplibx token -n "$(npx otplibx list | fzf | cut -f2)" | pbcopy
# OR
npx otplibx list | fzf | cut -f2 | xargs -I {} npx otplibx token -n {} | pbcopy
```

### otplib

For scripting or custom secret backends, use the stateless `otplib` CLI.

```bash
# Encode an otpauth URI into internal format
cat otp-uri.txt | otplib encode
# Output: A1B2C3D4=eyJkYXRhIjp7...}}

# Store the output in a JSON file (storage.json)
# { "A1B2C3D4": "eyJkYXRhIjp7...}}" }

# Generate token
cat storage.json | otplib token A1B2C3D4

# List entries
cat storage.json | otplib list
cat storage.json | otplib list --filter github

# Verify a token
cat storage.json | otplib verify A1B2C3D4 123456
```

## Commands

### otplibx

| Command                        | Description                       |
| ------------------------------ | --------------------------------- |
| `init [file]`                  | Initialize encrypted secrets file |
| `add`                          | Add entry (reads from stdin)      |
| `token [-n] [id]`              | Generate token                    |
| `type [-n] [id]`               | Output entry type                 |
| `hotp update-counter <id> [n]` | Update HOTP counter               |
| `verify <id> <token>`          | Verify token                      |
| `list [--filter <query>]`      | List entries                      |
| `guard update <key> <value>`   | Update guardrail                  |
| `guard rm <key>`               | Remove guardrail                  |
| `guard show`                   | Show guardrails                   |

Options: `-f, --file <path>` (default: `.env.otplibx`)

### otplib

| Command                        | Description                                |
| ------------------------------ | ------------------------------------------ |
| `encode [--save-uid <file>]`   | Encode otpauth URI/JSON to internal format |
| `list [-f, --filter <query>]`  | List entries                               |
| `token [-n] <id>`              | Generate token (auto-detect)               |
| `type [-n] <id>`               | Output entry type                          |
| `hotp update-counter <id> [n]` | Update HOTP counter                        |
| `verify <id> <token>`          | Verify token                               |
| `guard show`                   | Show guardrails                            |

## Documentation

See the [full documentation](https://otplib.yeojz.dev/guide/cli-tool) for detailed usage, architecture, and integration with other secret managers.

## License

[MIT](./LICENSE)
