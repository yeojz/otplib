# otplib Smoke Tests

This package contains smoke tests for the published `otplib` npm packages. It verifies that the published packages can be installed and used correctly in a clean environment.

## Purpose

These smoke tests run after packages are published to npm to ensure:

1. All packages can be installed successfully
2. Imports work correctly
3. Basic functionality works as expected
4. TypeScript types are properly exported and usable

## Structure

```
otplib-branch-2/
├── package.json           # Smoke test package configuration
├── tsconfig.json          # TypeScript configuration for type checking
├── test/
│   ├── otplib.test.js    # Runtime smoke tests
│   └── types.test.ts     # TypeScript type checking tests
└── README.md             # This file
```

## How It Works

1. The `pretest` script installs the latest published versions of all otplib packages from npm
2. Tests verify that:
   - The main `otplib` bundle works
   - Individual packages (`@otplib/totp`, `@otplib/hotp`, `@otplib/uri`, `@otplib/core`) work
   - Plugin packages work (`@otplib/plugin-crypto-*`, `@otplib/plugin-base32-*`)
   - TypeScript types are properly defined and usable

## Running Locally

```bash
npm install
npm test
```

## CI Integration

This smoke test is designed to be used in GitHub Actions workflow:

```yaml
- name: Checkout smoke tests
  uses: actions/checkout@v4
  with:
    repository: your-org/otplib
    ref: smoke
    path: smoke-tests

- name: Run smoke tests
  working-directory: smoke-tests
  run: |
    npm install
    npm test
```

## Notes

- This is an orphaned branch, separate from the main repository history
- The `pretest` script always installs the latest published versions
- Tests use Node.js built-in test runner (no external test framework required)
- TypeScript type checking ensures type definitions are correct
