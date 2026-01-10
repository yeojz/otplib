# Integrating Smoke Tests into Main Repository

This document explains how to integrate the smoke tests from this orphaned branch into your main repository's CI/CD pipeline.

## Quick Start

**Use the workflow template provided in this branch:**

See [MAIN-BRANCH-SETUP.md](./MAIN-BRANCH-SETUP.md) for detailed setup instructions and usage scenarios.

**Quick setup:**
```bash
# From your main branch
cp .github/workflows/smoke-test-main-branch-template.yml \
   .github/workflows/smoke-test.yml
```

Then customize for your needs. The template includes commented examples for different scenarios.

---

## Detailed Integration Options

## Option 1: Add Smoke Test Step to Publish Workflow

Add the following job to your `publish-npm.yml` workflow after the publish step:

```yaml
  smoke-test:
    name: Smoke Test Published Packages
    needs: publish
    if: needs.publish.outputs.published == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout smoke tests
        uses: actions/checkout@v4
        with:
          ref: smoke
          path: smoke-tests

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
          cache-dependency-path: smoke-tests/pnpm-lock.yaml

      - name: Wait for npm to propagate
        run: sleep 60

      - name: Install dependencies
        working-directory: smoke-tests
        run: pnpm install

      - name: Install otplib packages
        working-directory: smoke-tests
        env:
          OTPLIB_VERSION: latest  # or use a specific version
        run: pnpm install:packages

      - name: Run smoke tests
        working-directory: smoke-tests
        run: pnpm test
```

### Testing a Specific Version

To test a specific version (e.g., the version just published), you can extract and pass the version:

```yaml
      - name: Get published version
        id: version
        run: echo "VERSION=$(node -p "require('./packages/otplib/package.json').version")" >> $GITHUB_OUTPUT

      - name: Install otplib packages
        working-directory: smoke-tests
        env:
          OTPLIB_VERSION: ${{ steps.version.outputs.VERSION }}
        run: pnpm install:packages

      - name: Run smoke tests
        working-directory: smoke-tests
        run: pnpm test
```

## Option 2: Trigger Smoke Tests via Workflow Dispatch

After publishing, trigger the smoke test workflow in the smoke branch with a specific version:

```yaml
  trigger-smoke-tests:
    name: Trigger Smoke Tests
    needs: publish
    if: needs.publish.outputs.published == 'true'
    runs-on: ubuntu-latest
    steps:
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
              ref: 'smoke',
              inputs: {
                version: '${{ steps.version.outputs.VERSION }}'
              }
            });
```

## Option 3: Scheduled Smoke Tests

The smoke branch already includes a scheduled workflow that runs daily. You can also manually trigger it via the Actions tab in GitHub.

## Notes

- Wait at least 60 seconds after publishing before running smoke tests to allow npm to propagate the new packages
- The smoke tests install the version specified by `OTPLIB_VERSION` environment variable (defaults to `latest`)
- You can test specific versions by setting the `OTPLIB_VERSION` environment variable
- If smoke tests fail, it indicates an issue with the published packages
- The workflow can be manually triggered with a specific version via the GitHub Actions UI
