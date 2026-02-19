# Testing

This guide covers how to test otplib across different runtimes and environments.

## Overview

otplib is designed to work across multiple JavaScript runtimes:

- **Node.js** (versions 20, 22, 24)
- **Bun** (version 1.x)
- **Deno** (versions 1.x, 2.x)

The project provides two testing approaches:

1. **Local testing** - Running pnpm test commands directly
2. **Docker testing** - Using Docker containers for isolated multi-runtime testing

## Local Testing

Local testing is the primary development workflow. It uses Vitest for unit tests and runtime-specific test runners for distribution tests.

### Prerequisites

- Node.js >= 24.0.0
- pnpm >= 10.30.1
- (Optional) Bun and/or Deno installed locally for distribution tests

### Unit Tests

Unit tests validate source code directly using Vitest:

```bash
# Run all unit tests
pnpm test

# Run unit tests with coverage
pnpm test:ci

# Test a single package
pnpm --filter @otplib/core test -- run --project packages

# Run a specific test file
pnpm vitest run packages/core/src/utils.test.ts
```

### Distribution Tests

Distribution tests validate the built artifacts (`dist/`) across runtimes. These ensure that published packages work correctly in all target environments.

A build is required before running distribution tests:

```bash
# Build packages first
pnpm build

# Node.js distribution tests (Node 20, 22, 24)
pnpm test:dist-node

# Bun distribution tests (requires Bun installed)
pnpm test:dist-bun

# Deno distribution tests (requires Deno installed)
pnpm test:dist-deno
```

### Pre-Commit Validation

Before committing changes, run the full validation suite:

```bash
pnpm test && pnpm fix && pnpm typecheck
```

Or with coverage:

```bash
pnpm test:ci && pnpm fix && pnpm typecheck
```

### What Gets Tested

| Command          | What it tests                                        |
| ---------------- | ---------------------------------------------------- |
| `pnpm test`      | Unit tests across all packages                       |
| `pnpm test:ci`   | Unit tests with coverage (enforces coverage targets) |
| `pnpm lint`      | Code quality and style checks                        |
| `pnpm format`    | Code formatting (Prettier)                           |
| `pnpm typecheck` | TypeScript type validation across all packages       |
| `pnpm size`      | Bundle size validation                               |

### Recommended Workflow

For day-to-day development:

1. **While developing** - Run targeted tests:

   ```bash
   pnpm --filter @otplib/core test -- run --project packages
   ```

2. **Before committing** - Run full checks:

   ```bash
   pnpm fix && pnpm typecheck && pnpm test:ci
   ```

3. **Before pushing** - Verify distribution tests pass (if you have Bun/Deno installed):
   ```bash
   pnpm build && pnpm test:dist-node
   pnpm test:dist-bun
   pnpm test:dist-deno
   ```

## Docker Testing

For testing in isolated containerized environments without installing runtimes locally, use the Docker test runner.

### Prerequisites

- Docker Desktop or Docker Engine installed
- Docker Compose (v2+) installed

### Usage

The `test:docker` command runs tests in Docker containers for each runtime:

```bash
# Test all runtimes
pnpm run test:docker

# Test specific runtime
pnpm run test:docker node-20
pnpm run test:docker node-22
pnpm run test:docker node-24
pnpm run test:docker bun-1
pnpm run test:docker deno-1
pnpm run test:docker deno-2
```

### Available Runtimes

| Runtime   | Command                        | Description                     |
| --------- | ------------------------------ | ------------------------------- |
| `node-20` | `pnpm run test:docker node-20` | Tests on Node.js 20 Alpine      |
| `node-22` | `pnpm run test:docker node-22` | Tests on Node.js 22             |
| `node-24` | `pnpm run test:docker node-24` | Tests on Node.js 24             |
| `bun-1`   | `pnpm run test:docker bun-1`   | Tests on Bun 1.3 Alpine         |
| `deno-1`  | `pnpm run test:docker deno-1`  | Tests on Deno 1.x               |
| `deno-2`  | `pnpm run test:docker deno-2`  | Tests on Deno 2.x               |
| `all`     | `pnpm run test:docker`         | Tests all runtimes sequentially |

### Docker Test Architecture

Each runtime has its own Docker configuration:

- **Node.js tests**: Use `Dockerfile.test` (based on `node:20-alpine`)
- **Bun tests**: Use `Dockerfile.bun` (based on `bun:1.3.5-alpine`)
- **Deno tests**: Use `Dockerfile.deno` (based on official Deno images)

The Docker Compose configuration (`tests/docker-compose.test.yml`) orchestrates the build and execution of tests for each runtime.

### When to Use Docker Testing

Docker testing is particularly useful for:

- **Reproducing CI issues** - Exact match to CI environment
- **Testing new runtime versions** - Before updating CI configuration
- **Isolated testing** - Without installing Bun/Deno locally
- **Multi-runtime validation** - Ensure consistency across platforms

### Local vs Docker Testing

| Feature       | Local Testing              | Docker Testing                    |
| ------------- | -------------------------- | --------------------------------- |
| **Speed**     | Fast                       | Slower (builds images each time)  |
| **Setup**     | Runtimes installed locally | Only Docker required              |
| **Isolation** | Shared environment         | Full container isolation          |
| **Use Case**  | Day-to-day development     | CI reproduction, final validation |

## Continuous Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically runs on:

- Push to `main` branch
- Pull requests to `main`
- Manual workflow dispatch

### CI Workflow Stages

```
Stage 1: Quality Checks (parallel)
  |- lint
  |- typecheck
  \- security-audit (independent, no blocking)

Stage 2: Build & Test
  \- build-and-test (needs lint + typecheck)
        -> runs unit tests with coverage
        -> builds packages
        -> checks bundle size
        -> uploads coverage + dist artifacts

Stage 3: Distribution Tests (parallel, all need build-and-test)
  |- test-node (Node 20, 22, 24) -> downloads dist artifacts
  |- test-deno (Deno 1.x, 2.x)  -> downloads dist artifacts
  |- test-bun  (Bun 1.x)        -> downloads dist artifacts
  \- reporting                   -> uploads to Codecov

Stage 4: Validation
  \- all-checks (needs all above)
```

This architecture ensures:

- Unit tests and builds happen once (efficiency)
- Each runtime downloads and validates the same built artifacts
- Maximum parallelization across distribution tests
- Ensures that tests run on the distributed code instead of raw code

### Artifacts

Two artifact sets are produced by the `build-and-test` job:

- **`dist-artifacts`** (`packages/*/dist`) - downloaded by `test-node`, `test-deno`, `test-bun`, and `reporting`; retained for 1 day
- **`coverage-artifacts`** (`coverage/`, `reports/junit.xml`) - downloaded by `reporting` for Codecov upload

## Troubleshooting

### Docker tests fail to build

Ensure Docker daemon is running:

```bash
# Check Docker status
docker ps

# Restart Docker if needed
docker compose down
```

### Tests timeout locally

Docker tests may take longer than CI. Consider testing individual runtimes:

```bash
pnpm run test:docker node-20
```

### Artifact download fails in CI

Check that:

1. Build job completed successfully
2. Artifacts were uploaded (check build job logs)
3. Artifact name matches (`dist-artifacts`)

## Best Practices

1. **Run local checks before pushing** - Use `pnpm fix && pnpm typecheck && pnpm test:ci`
2. **Build before distribution tests** - Always run `pnpm build` first
3. **Use Docker for final validation** - Run `pnpm run test:docker` to match CI environment
4. **Check CI logs** - GitHub Actions provides detailed logs for debugging
5. **Monitor artifact size** - Build job checks bundle size automatically

## Contributing

When contributing to otplib:

1. Write tests for new functionality
2. Ensure tests pass locally: `pnpm fix && pnpm typecheck && pnpm test:ci`
3. Optionally verify cross-runtime compatibility: `pnpm build && pnpm test:dist-node`
4. Optionally validate in Docker: `pnpm run test:docker`
5. Push your changes and let CI run the full test suite

For more information on contributing, see the [Contributing Guide](https://github.com/yeojz/otplib/blob/main/CONTRIBUTING.md).
