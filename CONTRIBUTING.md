# Contributing to otplib

Thank you for your interest in contributing to otplib! This guide covers everything you need to get started.

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Getting Started

```bash
# Clone the repository
git clone https://github.com/yeojz/otplib.git
cd otplib

# Install dependencies
pnpm install
```

## Common Commands

```bash
# Development
pnpm install          # Install dependencies
pnpm build            # Build all packages (required before testing)
pnpm test             # Run all tests
pnpm test:ci          # Run tests with coverage
pnpm fix              # Lint + format (run before commits)
pnpm typecheck        # TypeScript validation

# Single package testing
pnpm --filter @otplib/core test -- --project packages
pnpm --filter otplib-cli test -- --project otplib-cli

# Run specific test file
pnpm vitest run packages/core/src/utils.test.ts

# Multi-runtime tests (See #Testing)
pnpm test:bun         # Bun-specific tests
pnpm test:deno        # Deno-specific tests
# OR
pnpm test:docker bun-1

# Documentation
pnpm docs:dev         # Start docs dev server. (Requires a manual pnpm run build before running)
pnpm docs:build       # Build documentation

# Other
pnpm size             # Check bundle sizes
```

## Project Structure

```
otplib/
├── packages/
│   ├── core/              # Core interfaces, types, utilities
│   ├── hotp/              # HOTP implementation (RFC 4226)
│   ├── totp/              # TOTP implementation (RFC 6238)
│   ├── uri/               # otpauth:// URI generation/parsing
│   ├── otplib/            # All-in-one bundle
│   ├── plugin-crypto-node/    # Node.js crypto plugin
│   ├── plugin-crypto-web/     # Web Crypto API plugin
│   ├── plugin-crypto-noble/   # Noble hashes plugin
│   └── plugin-base32-scure/   # Scure base32 plugin
├── apps/
│   ├── docs/              # VitePress documentation
└── internal/
    ├── benchmarks/        # Performance benchmarks
    ├── distribution-tests/# Tests for built artifacts across runtimes
    ├── fuzz-tests/        # Property-based fuzz testing
    ├── testing/           # Testing utilities and test suites
    └── typedoc/           # API documentation generator to put in docs/
```

- `internal/` - Internal packages that are not to be published
- `packages/` - Part of the core `otplib` ecosystem
- `apps/` - Applications that uses the library (i.e `packages/`)

## Testing Requirements

- `packages/`
  - 100% test coverage strictly required
  - Test must pass on all supported runtimes and environments.
- `apps/`
  - Test must pass tests. Preferably reaching full coverage.
  - Coverage thresholds dependent on application.
  - Strive for full coverage and provide reason for deciding not to.

### Test Types

**Unit Tests** (`packages/*/src/*.test.ts`)

- Test source code directly using Vitest
- Run with `pnpm test` or `pnpm test:ci` (with coverage)

**Distribution Tests** (`internal/distribution-tests/`)

- Test built artifacts (dist/) across Node.js 20/22/24, Deno, and Bun
- Ensures published packages work correctly in all target runtimes
- Run with `pnpm build && pnpm test:distribution`

### Local Testing

```bash
# Unit tests (source code)
pnpm test
pnpm test:ci          # with coverage

# Distribution tests (built artifacts)
pnpm build            # Required: build packages first
pnpm test:distribution # Node.js distribution tests
pnpm test:bun         # Bun distribution tests (requires Bun)
pnpm test:deno        # Deno distribution tests (requires Deno)
```

### Docker-based Multi-Runtime Testing

Since this library supports multiple runtimes (Bun 1.x, Deno 1.x/2.x, Node 20/22/23), you can use Docker to test across all environments without installing them locally:

```bash
# Test a specific runtime
./scripts/test-docker.sh node-20
./scripts/test-docker.sh bun
./scripts/test-docker.sh deno-2

# Test all runtimes
./scripts/test-docker.sh all
```

Available runtimes: `bun-1`, `deno-1`, `deno-2`, `node-20`, `node-22`, `node-24`

See [tests/docker-compose.test.yml](tests/docker-compose.test.yml) for configuration details.

## Making Changes

### Branching Strategy

- Create feature branches from `main`
- Use descriptive branch names: `feat/add-feature`, `fix/issue-123`, `docs/update-guide`

### Code Style

- TypeScript strict mode enabled
- ESLint and Prettier for formatting
- Run `pnpm fix` before committing

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: resolve issue with token generation
docs: update API documentation
test: add edge case tests
refactor: simplify validation logic
chore: update dependencies
```

## Pull Request Guidelines

1. **Create an issue first** for significant changes
2. **Keep PRs focused** - one feature or fix per PR
3. **Include tests** for new functionality
4. **Update documentation** if adding/changing APIs
5. **Run all checks** before submitting:
   ```bash
   pnpm fix && pnpm typecheck && pnpm test:ci
   ```

### PR Checklist

- [ ] Tests pass (`pnpm test:ci`)
- [ ] Coverage thresholds met (if applicable) (`pnpm test:ci`)
- [ ] Types check (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Code formatted (`pnpm format`)
- [ ] Documentation updated (if applicable)

### Release Process (For Maintainers)

Releases are managed by maintainers:

1. **Merge PRs**: Review and merge contributor PRs to `main`
2. **Version Bump**: Update package versions in `package.json` files as needed
3. **Publish**: Trigger the **Publish to npm** workflow via `workflow_dispatch` (Actions tab) to build and publish packages

## AI Usage Guidelines

Code or other content generated in whole or in part using AI tools can be contributed to the project, provided that it satisfies the following conditions:

### AI Tool Terms Compatibility

- Ensure the AI tool's terms don't conflict with the project's open source license, IP policies, or Open Source Definition

### Third-Party Content in AI Output

- Verify permission to use any third-party copyrighted materials (e.g., via compatible open source license or public domain)
- Provide attribution and license information for any third-party content included

### Responsible AI Usage

- You are responsible for reviewing, testing, and verifying any AI-assisted changes.
- If AI tools generated significant parts of your contribution, mention this in your PR so reviewers can provide appropriate guidance.

## Questions?

- Open a [GitHub Issues](https://github.com/yeojz/otplib/issues)
- Check the [documentation](https://otplib.yeojz.dev)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
