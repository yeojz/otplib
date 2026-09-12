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

- It is excluded from the root workspace by the `!internal/mutation` negation
  glob in the root `pnpm-workspace.yaml`, so it never enters the root install
  tree or the root `pnpm-lock.yaml`.
- It is its own workspace root: the `pnpm-workspace.yaml` here carries its
  settings (the `qs` security override). That is the one settings home both
  pnpm 10 and pnpm 11 read for this directory, since pnpm 11 no longer reads
  the package.json `pnpm` field and neither version reads this file under
  `--ignore-workspace`. The root's `minimumReleaseAge` is not repeated here:
  pnpm 11 enforces it against a frozen install's lockfile, and a freshly pinned
  toolchain lockfile always has entries younger than the window. The Dependabot
  cooldown on this directory covers the same risk.
- It carries no `packageManager` pin of its own, so it runs under whatever pnpm
  the root pins and needs no separate bump when the root moves.
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

`pnpm run audit:mutation` audits this toolchain's lockfile. CI runs it on every
pull request as an informational step (a warning plus a job-summary entry) rather
than a blocking one: this toolchain never builds the published packages, so an
advisory here should not block a library change or a release. The root production
tree is audited separately by `pnpm run audit`, which does block.

`test:mutation` invokes `internal/mutation/node_modules/.bin/stryker` from the repo
root, so `stryker.config.mjs` and its `mutate` globs resolve against the root as
usual.
