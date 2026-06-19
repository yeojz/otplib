# Mutation Testing Analysis

This document records a mutation-testing audit of the security-critical logic in
`otplib`, what it found, the changes made to close real test gaps, and a catalogue
of the surviving mutants that are intentionally left alone (equivalent / defence-in-depth).

Run it yourself:

```bash
pnpm test:mutation        # uses stryker.config.mjs
```

## Why mutation testing here

The suite already enforces **100% line/branch/function/statement coverage**
(`vitest.config.ts` thresholds). Coverage proves code is _executed_; it does not
prove the assertions would _fail_ if the behaviour changed. Mutation testing fills
that gap by introducing small faults ("mutants") and checking that some test fails
("kills" the mutant). Surviving mutants are either real test gaps or equivalent
mutants (no observable behaviour change).

Tooling: [Stryker](https://stryker-mutator.io/) with `@stryker-mutator/vitest-runner`.

## Scope

Pure-logic, security-critical modules where mutation testing has the highest signal:

| Module                                                     | What it covers                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| `packages/core/src/utils.ts`                               | guardrails, validation, RFC 4226 truncation, constant-time compare |
| `packages/uri/src/parse.ts`                                | `otpauth://` parsing + DoS limits                                  |
| `packages/uri/src/generate.ts`                             | `otpauth://` generation                                            |
| `packages/hotp/src/class.ts`, `packages/totp/src/class.ts` | public class wrappers                                              |
| `packages/plugin-base32-{scure,alt}`                       | Base32 / hex codecs                                                |

## Results

| Module            | Score before | Score after |
| ----------------- | ------------ | ----------- |
| `core/utils.ts`   | 95.41%       | **96.72%**  |
| `uri/generate.ts` | 94.12%       | **97.06%**  |
| `uri/parse.ts`    | 80.00%       | **81.62%**  |
| `hotp/class.ts`   | 83.33%       | **94.44%**  |
| `totp/class.ts`   | 89.29%       | **96.43%**  |

The remaining survivors after this work are all equivalent or defence-in-depth
mutants (catalogued below), not test gaps.

## A methodology caveat (important)

Stryker's raw "Survived" list **cannot be trusted at face value** for triage — each
candidate was manually verified by applying the exact mutant and re-running the
mapped test file. Two classes of noise were ruled out during this audit:

1. **Mutants that mutate only a sub-expression.** e.g. the `ConditionalExpression`
   mutant on `typeof value !== "number" || !Number.isSafeInteger(value)` replaces
   only the first operand → `false || !Number.isSafeInteger(value)`. That is
   _equivalent_ (a non-number is never a safe integer), so it survives legitimately —
   it is **not** the same as replacing the whole condition with `false`.
2. **Off-by-one / cache artifacts in ad-hoc verification.** Stryker report columns are
   1-based; vitest transform caching can mask a mutation across rapid write/run cycles.
   Verification was done with corrected offsets and isolated processes.

Conclusion after manual verification: of 66 reported survivors, **all 66 are genuine
survivors** (the suite genuinely does not kill them); they split into real gaps (now
fixed) and equivalent mutants (left as-is).

## Test gaps closed

Each item below was a mutant that survived because no assertion distinguished the
behaviour. Tests were added/tightened to kill them.

1. **Guardrail equality boundaries** (`utils.ts` `MIN_* > MAX_*`, mutated to `>=`).
   The suite only tested unequal values. Added tests that `MIN === MAX` is _accepted_
   for both secret-bytes and period.
2. **Tolerance error messages** (`utils.ts`, message string → `""`). The non-integer
   tolerance tests asserted only the error _type_. Added message assertions for
   `CounterToleranceError` / `EpochToleranceError`.
3. **Integer parameter lower bound** (`parse.ts` `parsed < min`, mutated to `<=`).
   `counter=0` and `period=1` are the valid minimums; the round-trip tests used
   `counter=42`. Added explicit boundary parse tests.
4. **Non-hyphenated algorithm names** (`parse.ts`, `"sha1"` literal → `""`). Only the
   `SHA-1` hyphenated form was tested. Added `algorithm=sha1` / `SHA1` parse tests.
5. **URI parameter type guards** (`generate.ts`, `type === "hotp"`/`"totp"` → `true`).
   Added tests that a TOTP URI omits `counter` and a HOTP URI omits `period` _even when
   the params object carries that value_ (exercising the low-level `generate`).
6. **Per-call guardrails override** (`hotp`/`totp` `class.ts`,
   `options?.guardrails ?? this.guardrails` → `&&`). This public feature was untested:
   no test passed `guardrails` at call time. Added generate+verify tests proving a
   per-call override takes precedence over instance guardrails.

## Surviving mutants left as-is (equivalent / defence-in-depth)

These survive by design. Chasing them would mean asserting redundant internal details
or removing intentional safety code. They are documented rather than "fixed".

- **Equivalent ternaries** (`utils.ts` `counterToBytes`, `validateCounter`:
  `typeof x === "bigint" ? x : BigInt(x)`). `BigInt(aBigInt)` is a no-op and JS
  number↔bigint comparisons coerce, so both branches behave identically.
- **Constant-time compare loop bound** (`utils.ts` `i < len` → `i <= len`). Reading one
  past the end yields `undefined → 0` under XOR, leaving the result unchanged. Equivalent
  (and the design deliberately tolerates length mismatch via an earlier guard).
- **Redundant type pre-check** (`utils.ts` `typeof value !== "number"` operand). Backstopped
  by `Number.isSafeInteger`, which already rejects non-numbers.
- **Defensive overflow pre-check** (`utils.ts` `validateCounter` safe-integer branch).
  Backstopped by the subsequent `value > MAX_COUNTER` bigint check, which throws the same
  `CounterOverflowError`.
- **DoS length pre-checks** (`parse.ts` `str.length > maxLength * 3`). Defence-in-depth in
  front of the post-decode `decoded.length > maxLength` check; both produce
  `InvalidURIError`. The pre-check exists to avoid decoding pathologically large input.
- **Regex anchors in numeric/digit parsing** (`parse.ts` `/^-?\d+$/`, `/^\d+$/`). Backstopped
  by `Number()` + `Number.isSafeInteger` + the `{6,7,8}` digit-set check, which reject the
  same inputs the anchors would.
- **Error-message _context_ strings** (`parse.ts` `"label"`, `` `parameter '${key}'` ``).
  Only affect human-readable error text, asserted loosely on purpose.
- **`sha1`/default omission in generation** (`generate.ts`, `class.ts` `algorithm = "sha1"`
  default → `""`). RFC-default `sha1` is omitted from the URI; an empty string is falsy and
  is likewise omitted, so the output is identical.
- **Base32 codecs** (`plugin-base32-scure` trailing-padding regex; `plugin-base32-alt`
  empty-input early return, read-past-end loop bound, and the `i*2` hex slice — the last is
  equivalent because `Uint8Array` truncates to the low byte, which is always the correct
  two hex digits).

## "Unnecessary tests"

No clearly redundant or dead tests were found — the suite is lean and purposeful, and
every module retains 100% coverage. What mutation testing _did_ surface is redundant
**code** (the defence-in-depth / equivalent items above): logic that no test can
distinguish because a later check enforces the same invariant. These are intentional
safety layers, not candidates for deletion; they are documented here so future readers
don't mistake their surviving mutants for missing tests.

## Recommendations

- Treat mutation score as a **diagnostic, not a CI gate** for now. A hard threshold would
  fail on the equivalent mutants above without improving the suite.
- When adding new branching/validation logic, run `pnpm test:mutation` on the touched file
  and verify any new survivor is genuinely equivalent before merging.
- If a CI gate is ever desired, scope it to modules with no equivalent mutants (e.g.
  `generate.ts` at 97%+) rather than the whole repo.
