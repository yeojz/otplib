# Fuzz Testing

In `otplib`, we use **Property-Based Testing** via [fast-check](https://github.com/dubzzz/fast-check) to define "properties" (truths) that should always hold true, regardless of the input.

## Key Properties Tested

1.  **Invariants**:
    - **Round-tripping**: `decode(encode(x))` must always equal `x`.
    - **Determinism**: Functions must produce identical output for identical inputs.
2.  **Robustness**:
    - The library must not crash or hang when given "garbage" input (e.g., random strings, massive buffers, control characters).
    - It must fail gracefully with expected errors (e.g., `TokenFormatError`) rather than internal implementation errors (e.g., `TypeError`, `RangeError`).
3.  **Security Boundaries**:
    - Different algorithms (SHA1 vs SHA256) must produce different tokens.
    - Different counters/epochs must produce different tokens.
4.  **Consistency**:
    - Different crypto implementations (e.g. Node, Noble) must produce identical results for the same inputs.

## Running Fuzz Tests

These tests are located in the internal `@repo/fuzz-tests` package.

```bash
# Run all fuzz tests
pnpm --filter @repo/fuzz-tests test
```
