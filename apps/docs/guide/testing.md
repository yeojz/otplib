# Testing

This guide covers how to test otplib across different runtimes and environments.

## Overview

otplib is designed to work across multiple JavaScript runtimes:

- **Node.js** (versions 20, 22, 24)
- **Bun** (version 1.x)
- **Deno** (versions 1.x, 2.x)

The project provides two main testing approaches:

1. **Docker testing** - Using Docker containers for isolated runtime testing
2. **Local CI testing** - Using `act` to run GitHub Actions workflows locally

## Docker Testing

For testing in isolated containerized environments, use the Docker test runner.

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
- **Isolated testing** - Without affecting local environment
- **Multi-runtime validation** - Ensure consistency across platforms

### Local CI vs Docker Testing

| Feature       | Local CI (`act`)      | Docker Testing                    |
| ------------- | --------------------- | --------------------------------- |
| **Speed**     | Fast (shared cache)   | Slower (build images each time)   |
| **Accuracy**  | High (GitHub Actions) | Very High (production containers) |
| **Isolation** | Container isolation   | Full container isolation          |
| **Use Case**  | Development workflow  | CI reproduction, validation       |

## Local CI Testing

The `test-ci.sh` script allows you to run GitHub Actions workflows locally using [act](https://github.com/nektos/act), which runs GitHub Actions in Docker containers.

### Prerequisites

Install `act` on your system:

```bash
# macOS
brew install act

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### Usage

The test script provides several commands for testing different parts of the CI workflow:

```bash
# Show all available commands
./scripts/test-ci.sh

# List all CI jobs
./scripts/test-ci.sh list

# Dry run (shows execution order without running)
./scripts/test-ci.sh dry-run

# Test individual jobs
./scripts/test-ci.sh build        # Build packages and upload artifacts
./scripts/test-ci.sh test-node    # Test Node.js versions
./scripts/test-ci.sh test-deno    # Test Deno versions
./scripts/test-ci.sh test-bun     # Test Bun

# Test artifact flow (recommended)
./scripts/test-ci.sh artifacts    # Tests: build → test-deno/test-bun

# Run all critical checks
./scripts/test-ci.sh all-checks   # lint → typecheck → build → test-node

# Full workflow (slow!)
./scripts/test-ci.sh full
```

### Command Reference

| Command      | Description                               | Time      |
| ------------ | ----------------------------------------- | --------- |
| `list`       | Shows all available CI jobs               | 5s        |
| `dry-run`    | Shows job execution order without running | 5s        |
| `build`      | Builds packages and uploads artifacts     | 2-3 min   |
| `test-node`  | Tests on Node 20, 22, 24                  | 3-5 min   |
| `test-deno`  | Tests Deno 1.x, 2.x                       | 2-3 min   |
| `test-bun`   | Tests Bun 1.x                             | 1-2 min   |
| `artifacts`  | Tests artifact upload/download flow       | 5-8 min   |
| `all-checks` | Runs lint, typecheck, build, test-node    | 5-8 min   |
| `full`       | Complete CI workflow                      | 10-15 min |

### Recommended Workflow

For development, we recommend this testing workflow:

1. **Quick validation** - Before committing changes:

   ```bash
   ./scripts/test-ci.sh build
   ```

2. **Test artifact flow** - Verify cross-runtime compatibility:

   ```bash
   ./scripts/test-ci.sh artifacts
   ```

   This tests the complete artifact upload/download flow, ensuring that:
   - Build job creates and uploads artifacts correctly
   - test-deno downloads and uses artifacts
   - test-bun downloads and uses artifacts

3. **Pre-commit checks** - Run all critical checks:
   ```bash
   ./scripts/test-ci.sh all-checks
   ```

### What Gets Tested

The CI workflow tests:

- **Lint**: Code quality and formatting checks
- **Type Check**: TypeScript type validation across all packages
- **Build**: Package compilation and bundle size validation
- **test-node**: Tests on Node.js 20, 22, 24 (each builds locally)
- **test-deno**: Tests on Deno 1.x and 2.x (uses build artifacts)
- **test-bun**: Tests on Bun 1.x (uses build artifacts)

### Architecture

The CI workflow is optimized for efficiency:

```
Stage 1: Foundation (parallel)
  ├── lint
  ├── typecheck
  └── security-audit

Stage 2a: Build & Test (parallel)
  ├── build (Node 20) → uploads artifacts
  └── test-node (Node 20/22/24) → builds locally

Stage 2b: Runtime Tests (parallel)
  ├── test-deno → downloads from build
  └── test-bun → downloads from build
```

This architecture ensures:

- Each Node version builds independently (compatibility testing)
- Deno and Bun reuse build artifacts (efficiency)
- Maximum parallelization (faster CI)

## Continuous Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically runs on:

- Push to `main` branch
- Pull requests to `main`
- Manual workflow dispatch

### CI Workflow Stages

1. **Quality Checks** - Lint, type check, security audit
2. **Build** - Compile packages and upload artifacts
3. **Test** - Run tests across all supported runtimes
4. **Validate** - Aggregate results and ensure all checks pass

### Artifacts

Build artifacts (`packages/*/dist`) are:

- Uploaded from the build job (Node 20)
- Downloaded by test-deno and test-bun jobs
- Retained for 1 day
- Used to avoid redundant builds

## Troubleshooting

### act fails with architecture errors

If you're on Apple M-series hardware:

```bash
# The script automatically handles this, but if you run act directly:
act --container-architecture linux/amd64 -j build
```

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

1. **Run local checks before pushing** - Use `./scripts/test-ci.sh all-checks`
2. **Test artifact flow** - Use `./scripts/test-ci.sh artifacts` to verify cross-runtime compatibility
3. **Use Docker for final validation** - Run `pnpm run test:docker` to match CI environment
4. **Check CI logs** - GitHub Actions provides detailed logs for debugging
5. **Monitor artifact size** - Build job checks bundle size automatically

## Contributing

When contributing to otplib:

1. Write tests for new functionality
2. Ensure tests pass locally: `./scripts/test-ci.sh all-checks`
3. Verify cross-runtime compatibility: `./scripts/test-ci.sh artifacts`
4. Optionally validate in Docker: `pnpm run test:docker`
5. Push your changes and let CI run the full test suite

For more information on contributing, see the [Contributing Guide](https://github.com/yeojz/otplib/blob/main/CONTRIBUTING.md).
