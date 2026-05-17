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

The table below is a curated subset of the full suite — generation (no verify) on the common SHA-1 path, a single Base32 length, and the core utilities — written by `docs:benchmarks` to `apps/docs/public/benchmarks.json`. The capture timestamp and host environment are shown above the results so you can judge how recent and how comparable the numbers are to your own machine. For the full sweep (SHA-256/512, verify with windows, more Base32 sizes, URI parse/generate), run `pnpm --filter @repo/benchmarks bench`.

<BenchmarkTable />
