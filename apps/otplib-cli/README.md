# otplib-cli

A Command Line tool for OTP operations.

Pair with [dotenvx](https://github.com/dotenvx/dotenvx) for encrypted storage.

## Installation

```bash
npm install -g otplib-cli
```

Two commands are available:

- **`otplibx`** - Integrated with dotenvx as storage (recommended)
- **`otplib`** - Stateless CLI for scripting and custom backends

## Quick Start

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
otplibx list | fzf | cut -f2 | otplibx token -n | pbcopy
```

## Commands

### otplibx

| Command                      | Description                       |
| ---------------------------- | --------------------------------- |
| `init [file]`                | Initialize encrypted secrets file |
| `add`                        | Add entry (reads from stdin)      |
| `token [-n] [id]`            | Generate token                    |
| `list [--filter <query>]`    | List entries                      |
| `guard update <key> <value>` | Update guardrail                  |
| `guard rm <key>`             | Remove guardrail                  |
| `guard show`                 | Show guardrails                   |

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
