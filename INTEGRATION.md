# Integrating Smoke Tests into Main Repository

This document explains how to integrate the smoke tests from this orphaned branch into your main repository's CI/CD pipeline.

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

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: "https://registry.npmjs.org"

      - name: Wait for npm to propagate
        run: sleep 60

      - name: Run smoke tests
        working-directory: smoke-tests
        run: |
          npm install
          npm test
```

## Option 2: Trigger Smoke Tests via Workflow Dispatch

After publishing, trigger the smoke test workflow in the smoke branch:

```yaml
  trigger-smoke-tests:
    name: Trigger Smoke Tests
    needs: publish
    if: needs.publish.outputs.published == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger smoke test workflow
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'smoke-test.yml',
              ref: 'smoke'
            });
```

## Option 3: Scheduled Smoke Tests

The smoke branch already includes a scheduled workflow that runs daily. You can also manually trigger it via the Actions tab in GitHub.

## Notes

- Wait at least 60 seconds after publishing before running smoke tests to allow npm to propagate the new packages
- The smoke tests always install the latest published versions
- If smoke tests fail, it indicates an issue with the published packages
