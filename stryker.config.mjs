/**
 * Stryker mutation testing configuration.
 *
 * Mutation testing complements the 100% line/branch coverage gate: coverage proves
 * code is executed, mutation testing proves the assertions actually detect changes
 * in behaviour. Run with `pnpm test:mutation`.
 *
 * Scope is limited to the pure-logic, security-critical modules where mutation
 * testing has the highest signal (validation guardrails, RFC truncation, URI
 * parsing/generation and the public class wrappers). Widen `mutate` to audit more.
 *
 * Notes:
 * - `coverageAnalysis: "all"` is used over "perTest" for reliability with the
 *   multi-project vitest workspace config; runs are still ~1 minute for this scope.
 * - Some surviving mutants are intentionally *equivalent* (no observable behaviour
 *   change) — see the "Mutation Testing" section in apps/docs/guide/testing.md.
 * - Stryker is not a standing devDependency: `pnpm test:mutation` fetches
 *   `@stryker-mutator/core`, `@stryker-mutator/vitest-runner` and the `typescript`
 *   peer the vitest-runner needs at runtime, on demand via `pnpm dlx`, all pinned
 *   to exact versions. `@ts-check` is dropped here since the `@stryker-mutator/api`
 *   types are not installed; this file is outside the `typecheck`/`lint` inputs
 *   (root config, not under any package's `src/`) so there is nothing to keep
 *   passing anyway.
 *
 * @type {object}
 */
export default {
  packageManager: "pnpm",
  testRunner: "vitest",
  plugins: ["@stryker-mutator/vitest-runner"],
  reporters: ["clear-text", "json", "html"],
  vitest: {
    configFile: "vitest.config.ts",
  },
  coverageAnalysis: "all",
  concurrency: 4,
  timeoutMS: 60000,
  mutate: [
    "packages/core/src/utils.ts",
    "packages/uri/src/parse.ts",
    "packages/uri/src/generate.ts",
    "packages/hotp/src/class.ts",
    "packages/totp/src/class.ts",
    "packages/plugin-base32-scure/src/index.ts",
    "packages/plugin-base32-alt/src/utils.ts",
    "!packages/**/*.test.ts",
  ],
  jsonReporter: {
    fileName: "reports/mutation/mutation.json",
  },
  htmlReporter: {
    fileName: "reports/mutation/mutation.html",
  },
  tempDirName: ".stryker-tmp",
};
