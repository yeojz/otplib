# Benchmarks

We maintain a suite of benchmarks using [tinybench](https://github.com/tinylibs/tinybench) to monitor performance regressions and ensure the library remains lightweight and fast.

## Benchmarked Areas

- **HOTP & TOTP Generation**: Measuring the speed of token generation across different hashing algorithms (SHA-1, SHA-256, SHA-512).
- **Verification**: Measuring the cost of `verify()` with and without window look-ahead (tolerance).
- **Base32 Operations**: Measuring the throughput of encoding and decoding secrets of various lengths.
- **Core Utilities**: Measuring the primitives that sit on the hot path — `constantTimeEqual`, `counterToBytes`, `dynamicTruncate`, and `truncateDigits`.
- **URI**: Measuring `keyuri` parse and generate (including the `generateTOTP` / `generateHOTP` helpers and roundtrips).

## Running Benchmarks

Benchmarks are located in the internal `@repo/benchmarks` package.

```bash
# Run all benchmarks
pnpm --filter @repo/benchmarks bench

# Regenerate the dataset shown below
pnpm --filter @repo/benchmarks docs:benchmarks
```

## Performance Results

A few things to keep in mind when reading the table below:

- **Curated subset.** It covers the common SHA-1 generate path, a single Base32 length, and the core utilities — no `verify`, no SHA-256/512, no URI rows.
- **How it's produced.** `docs:benchmarks` writes the snapshot to `apps/docs/public/benchmarks.json`; the capture timestamp and host environment shown above the results help you judge how recent and how comparable the numbers are to your own machine.
- **Full sweep.** For SHA-256/512, `verify` with windows, more Base32 sizes, and URI parse/generate, run `pnpm --filter @repo/benchmarks bench`.

<BenchmarkTable />
