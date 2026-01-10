/**
 * Base32 Encoding/Decoding Performance Benchmarks
 *
 * Measures Base32 operations with different payload sizes.
 */

import { stringToBytes } from "@otplib/core";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { Bench } from "tinybench";

const bench = new Bench({ time: 1000 });

const base32 = new ScureBase32Plugin();

// Test data of various sizes - using strings and converting with utility
const small = stringToBytes("0123456789"); // 10 bytes - Minimal secret
const medium = stringToBytes("01234567890123456789"); // 20 bytes - Standard SHA-1 secret
const large = stringToBytes("01234567890123456789012345678901"); // 32 bytes - SHA-256 secret
const xlarge = stringToBytes("0123456789012345678901234567890123456789012345678901234567890123"); // 64 bytes - SHA-512 secret

// Pre-encode for decode benchmarks
const smallEncoded = base32.encode(small);
const mediumEncoded = base32.encode(medium);
const largeEncoded = base32.encode(large);
const xlargeEncoded = base32.encode(xlarge);

// Encoding Benchmarks
bench
  .add("Base32 encode - 10 bytes (minimal)", () => {
    base32.encode(small);
  })
  .add("Base32 encode - 20 bytes (SHA-1 secret)", () => {
    base32.encode(medium);
  })
  .add("Base32 encode - 32 bytes (SHA-256 secret)", () => {
    base32.encode(large);
  })
  .add("Base32 encode - 64 bytes (SHA-512 secret)", () => {
    base32.encode(xlarge);
  })
  .add("Base32 encode - 20 bytes (with padding)", () => {
    base32.encode(medium, { padding: true });
  });

// Decoding Benchmarks
bench
  .add("Base32 decode - 10 bytes (minimal)", () => {
    base32.decode(smallEncoded);
  })
  .add("Base32 decode - 20 bytes (SHA-1 secret)", () => {
    base32.decode(mediumEncoded);
  })
  .add("Base32 decode - 32 bytes (SHA-256 secret)", () => {
    base32.decode(largeEncoded);
  })
  .add("Base32 decode - 64 bytes (SHA-512 secret)", () => {
    base32.decode(xlargeEncoded);
  });

// Mixed operations (common usage pattern)
bench.add("Base32 roundtrip - 20 bytes", () => {
  const encoded = base32.encode(medium);
  base32.decode(encoded);
});

await bench.run();

console.log("\n=== Base32 Benchmark Results ===\n");
console.table(
  bench.tasks.map((task) => ({
    Name: task.name,
    "Ops/sec": task.result?.hz.toFixed(2),
    "Avg (ms)": task.result?.mean.toFixed(6),
    "Min (ms)": task.result?.min.toFixed(6),
    "Max (ms)": task.result?.max.toFixed(6),
    Samples: task.result?.samples.length,
  })),
);
