# Setting Up Smoke Tests in Main Branch

This guide explains how to integrate the smoke tests from this orphaned `smoke` branch into your main branch.

## Quick Setup

1. Copy the workflow template to your main branch:
   ```bash
   # From your main branch
   cp .github/workflows/smoke-test-main-branch-template.yml \
      .github/workflows/smoke-test.yml
   ```

2. Customize the workflow for your needs (see scenarios below)

3. Commit and push to main branch

## Usage Scenarios

### Scenario 1: Manual Testing Only

Use this if you want to manually trigger smoke tests via GitHub Actions UI.

**Configuration:**
```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: "otplib version to test (e.g., 13.0.0, latest)"
        required: false
        default: "latest"
```

**Usage:**
- Go to Actions tab → Smoke Test → Run workflow
- Optionally specify a version to test

### Scenario 2: After Publishing Packages

Use this to automatically run smoke tests after successful npm publish.

**Configuration:**
```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: "otplib version to test (e.g., 13.0.0, latest)"
        required: false
        default: "latest"
  workflow_run:
    workflows: ["Publish to npm"]
    types:
      - completed

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    if: ${{ github.event_name != 'workflow_run' || github.event.workflow_run.conclusion == 'success' }}
    # ... rest of job
    steps:
      # ... other steps

      - name: Wait for npm to propagate
        run: sleep 60

      # ... rest of steps
```

**Notes:**
- Workflow name must match your publish workflow exactly
- Waits 60 seconds for npm to propagate new packages
- Only runs if publish was successful

### Scenario 3: Scheduled Testing

Use this to run smoke tests on a schedule (e.g., nightly).

**Configuration:**
```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: "otplib version to test (e.g., 13.0.0, latest)"
        required: false
        default: "latest"
  schedule:
    - cron: "0 2 * * *"  # Daily at 2 AM UTC
```

### Scenario 4: Test Specific Published Version

Use this to test the exact version that was just published.

Add this to your publish workflow to extract the version and trigger smoke tests:

```yaml
# In your publish-npm.yml workflow
jobs:
  publish:
    # ... your publish steps

  trigger-smoke-tests:
    name: Trigger Smoke Tests
    needs: publish
    if: needs.publish.outputs.published == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Get published version
        id: version
        run: echo "VERSION=$(node -p "require('./packages/otplib/package.json').version")" >> $GITHUB_OUTPUT

      - name: Trigger smoke test workflow
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'smoke-test.yml',
              ref: 'main',
              inputs: {
                version: '${{ steps.version.outputs.VERSION }}'
              }
            });
```

## Workflow Template Explained

```yaml
# Checkout the smoke branch into a subdirectory
- name: Checkout smoke tests
  uses: actions/checkout@v4
  with:
    ref: smoke              # The orphaned smoke test branch
    path: smoke-tests       # Checkout to subdirectory

# Setup pnpm (must match packageManager in smoke tests)
- name: Setup pnpm
  uses: pnpm/action-setup@v4

# Setup Node.js with pnpm cache
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    cache: "pnpm"
    cache-dependency-path: smoke-tests/pnpm-lock.yaml

# All commands run in the smoke-tests directory
- name: Install dependencies
  working-directory: smoke-tests
  run: pnpm install

# Install the published otplib packages
- name: Install otplib packages
  working-directory: smoke-tests
  run: pnpm install:packages

# Run the smoke tests
- name: Run smoke tests
  working-directory: smoke-tests
  run: pnpm test
```

## Environment Variables

The workflow uses `OTPLIB_VERSION` environment variable:

```yaml
env:
  OTPLIB_VERSION: ${{ github.event.inputs.version || 'latest' }}
```

This defaults to `latest` but can be overridden:
- Via workflow_dispatch input
- By setting it explicitly in the workflow
- By passing it from another workflow

## Testing the Workflow Locally

You can test the smoke tests locally before committing the workflow:

```bash
# Clone the smoke branch
git clone -b smoke https://github.com/your-org/otplib.git otplib-smoke

cd otplib-smoke

# Install dependencies
pnpm install

# Test latest version
pnpm install:packages && pnpm test

# Test specific version
OTPLIB_VERSION=13.0.0 pnpm install:packages && pnpm test
```

## Troubleshooting

### Smoke tests fail immediately after publishing

**Problem:** npm hasn't propagated the new packages yet.

**Solution:** Add a wait step before installing packages:
```yaml
- name: Wait for npm to propagate
  run: sleep 60
```

### Workflow can't find pnpm

**Problem:** pnpm setup is missing or incorrect.

**Solution:** Ensure pnpm setup happens before Node.js setup:
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4

- name: Setup Node.js
  uses: actions/setup-node@v4
```

### Cache not working

**Problem:** pnpm cache path is incorrect.

**Solution:** Ensure cache-dependency-path points to the smoke tests:
```yaml
cache-dependency-path: smoke-tests/pnpm-lock.yaml
```

### Version not being applied

**Problem:** OTPLIB_VERSION environment variable not set correctly.

**Solution:** Check the env section at workflow level:
```yaml
env:
  OTPLIB_VERSION: ${{ github.event.inputs.version || 'latest' }}
```

## Complete Example

Here's a complete workflow that combines manual triggering and post-publish testing:

```yaml
name: Smoke Test

on:
  workflow_dispatch:
    inputs:
      version:
        description: "otplib version to test (e.g., 13.0.0, latest)"
        required: false
        default: "latest"
  workflow_run:
    workflows: ["Publish to npm"]
    types:
      - completed

permissions:
  contents: read

env:
  OTPLIB_VERSION: ${{ github.event.inputs.version || 'latest' }}

jobs:
  smoke-test:
    name: Smoke Test (Node.js ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    if: ${{ github.event_name != 'workflow_run' || github.event.workflow_run.conclusion == 'success' }}
    strategy:
      fail-fast: false
      matrix:
        node-version: [20, 22, 24]
    steps:
      - name: Checkout smoke tests
        uses: actions/checkout@v4
        with:
          ref: smoke
          path: smoke-tests

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "pnpm"
          cache-dependency-path: smoke-tests/pnpm-lock.yaml

      - name: Wait for npm to propagate
        if: github.event_name == 'workflow_run'
        run: sleep 60

      - name: Install dependencies
        working-directory: smoke-tests
        run: pnpm install

      - name: Install otplib packages
        working-directory: smoke-tests
        run: pnpm install:packages

      - name: Run smoke tests
        working-directory: smoke-tests
        run: pnpm test

      - name: Run TypeScript type check
        working-directory: smoke-tests
        run: pnpm test:typecheck
```
