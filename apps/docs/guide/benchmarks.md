# Benchmarks

We maintain a suite of benchmarks using [tinybench](https://github.com/tinylibs/tinybench) to monitor performance regressions and ensure the library remains lightweight and fast.

## Benchmarked Areas

- **HOTP & TOTP Generation**: Measuring the speed of token generation across different hashing algorithms (SHA-1, SHA-256, SHA-512).
- **Verification**: Measuring the cost of `verify()` with and without window look-ahead (tolerance).
- **Base32 Operations**: Measuring the throughput of encoding and decoding secrets of various lengths.

## Running Benchmarks

Benchmarks are located in the internal `@repo/benchmarks` package.

```bash
# Run all benchmarks
pnpm --filter @repo/benchmarks bench
```

## Performance Results

<BenchmarkTable />

**Key Observations:**

- **Node.js Crypto** implementation is approx. 1.5x faster than the pure JS (noble) implementation.
- **Base32 decoding** is extremely fast (>1.4M ops/sec), making it negligible in the overall auth flow.
- **Token verification** (dominated by HMAC generation) can handle hundreds of thousands of requests per second on a single core.
