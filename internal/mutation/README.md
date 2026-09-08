# @repo/mutation

Isolated toolchain for [StrykerJS](https://stryker-mutator.io/) mutation testing.

## Why this is not a workspace package

Stryker only runs on demand — locally via `pnpm test:mutation`, or through the
manual `.github/workflows/mutation.yml` dispatch. Keeping it in the root
`devDependencies` would pull it (and its transitive tree) into every `pnpm install`
for every contributor and every CI job that never runs it.

Fetching it on demand with `pnpm dlx` was the obvious alternative, but it is worse
for supply-chain safety: `dlx` resolves the whole transitive tree fresh on every
run with no lockfile, and on pnpm 10 it does not honour the repo's
`minimumReleaseAge` setting either. Top-level version pins do not lock what those
packages themselves depend on.

So this directory is a standalone project instead:

- It is excluded from the workspace by the `!internal/mutation` negation glob in
  the root `pnpm-workspace.yaml`, so it never enters the root install tree or the
  root `pnpm-lock.yaml`.
- It carries its own `pnpm-lock.yaml`, so the entire transitive tree is pinned and
  reproducible, and Dependabot keeps it updated like any other manifest.
- Direct dependencies are pinned to exact versions. `vitest` and `typescript` are
  held at the same versions the root workspace resolves, since Stryker's
  vitest-runner loads the repo's own `vitest.config.ts`.

## Usage

Run both commands from the repository root:

```bash
pnpm test:mutation:install   # once, and after this lockfile changes
pnpm test:mutation
```

`test:mutation` invokes `internal/mutation/node_modules/.bin/stryker` from the repo
root, so `stryker.config.mjs` and its `mutate` globs resolve against the root as
usual.
