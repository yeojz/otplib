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
├── .github/workflows/
│   ├── smoke-test.yml                      # Workflow for this smoke branch
│   └── smoke-test-main-branch-template.yml # Template for main branch
├── test/
│   ├── otplib.test.js                      # Runtime smoke tests (ESM)
│   ├── types.test.ts                       # TypeScript type checking tests
│   └── require.test.cjs                    # CommonJS require smoke tests
├── package.json                            # Smoke test package configuration
├── tsconfig.json                           # TypeScript configuration
├── install-packages.sh                     # Script to install otplib packages
├── README.md                               # This file
├── MAIN-BRANCH-SETUP.md                    # Setup guide for main branch
└── INTEGRATION.md                          # Integration options
```

## How It Works

1. Run `npm run install:packages` to install the specified version of all otplib packages from npm
2. Run `npm run test:all` to verify everything:
   - **ESM Tests** (`test/*.test.js`): Verifies imports and functionality of main bundle and sub-packages
   - **CommonJS Tests** (`test/*.test.cjs`): Verifies `require()` usage in CJS environments
   - **TypeScript Tests** (`test/*.test.ts`): Verifies type definitions and compilation

## Running Locally

```bash
# Install dev dependencies
npm install

# Install and test the latest version (default)
npm run install:packages && npm run test:all

# Test a specific version
OTPLIB_VERSION=13.0.0 npm run install:packages && npm run test:all

# Install packages only (without running tests)
npm run install:packages
```

## Configuration

### Environment Variables

- `OTPLIB_VERSION` - Version of otplib packages to install and test (default: `latest`)
  - Examples: `latest`, `13.0.0`, `12.0.1`
  - Set this before running `npm run install:packages`

## CI Integration

This smoke test is designed to be used in GitHub Actions workflow:

See the `main` branch [smoke-test-packages.yml](https://github.com/yeojz/otplib/blob/main/.github/workflows/smoke-test-packages.yml)

## Notes

- This is an orphaned branch, separate from the main repository history
- Uses `npm` for development dependencies
- Uses `npm install --no-save` for installing otplib packages to keep `package.json` clean
- Tests use Node.js built-in test runner (no external test framework required)
- TypeScript type checking ensures type definitions are correct
