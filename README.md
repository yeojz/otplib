# otplib Smoke Tests

This package contains smoke tests for the published `otplib` npm packages. It verifies that the published packages can be installed and used correctly in a clean environment.

> **Setting up smoke tests in your main branch?**
> See [MAIN-BRANCH-SETUP.md](./MAIN-BRANCH-SETUP.md) for the workflow template and setup instructions.

## Purpose

These smoke tests run after packages are published to npm to ensure:

1. All packages can be installed successfully
2. Imports work correctly
3. Basic functionality works as expected
4. TypeScript types are properly exported and usable

## Structure

```
otplib-branch-2/
├── .github/workflows/
│   ├── smoke-test.yml                      # Workflow for this smoke branch
│   └── smoke-test-main-branch-template.yml # Template for main branch
├── test/
│   ├── otplib.test.js                      # Runtime smoke tests
│   └── types.test.ts                       # TypeScript type checking tests
├── package.json                            # Smoke test package configuration
├── tsconfig.json                           # TypeScript configuration
├── install-packages.sh                     # Script to install otplib packages
├── README.md                               # This file
├── MAIN-BRANCH-SETUP.md                    # Setup guide for main branch
└── INTEGRATION.md                          # Integration options
```

## How It Works

1. Run `pnpm install:packages` to install the specified version of all otplib packages from npm
2. Run `pnpm test` to verify that:
   - The main `otplib` bundle works
   - Individual packages (`@otplib/totp`, `@otplib/hotp`, `@otplib/uri`, `@otplib/core`) work
   - Plugin packages work (`@otplib/plugin-crypto-*`, `@otplib/plugin-base32-*`)
   - TypeScript types are properly defined and usable

## Running Locally

```bash
# Install dev dependencies
pnpm install

# Install and test the latest version (default)
pnpm install:packages && pnpm test

# Test a specific version
OTPLIB_VERSION=13.0.0 pnpm install:packages && pnpm test

# Install packages only (without running tests)
pnpm install:packages
```

## Configuration

### Environment Variables

- `OTPLIB_VERSION` - Version of otplib packages to install and test (default: `latest`)
  - Examples: `latest`, `13.0.0`, `12.0.1`
  - Set this before running `pnpm install:packages`

## CI Integration

This smoke test is designed to be used in GitHub Actions workflow:

See the `main` branch [smoke-test-packages.yml](https://github.com/yeojz/otplib/blob/main/.github/workflows/smoke-test-packages.yml)

## Notes

- This is an orphaned branch, separate from the main repository history
- Uses pnpm for package management, consistent with the main repository
- Tests use Node.js built-in test runner (no external test framework required)
- TypeScript type checking ensures type definitions are correct
