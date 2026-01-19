/**
 * Core Utility Performance Benchmarks
 *
 * Measures low-level operations:
 * - Constant-time comparison
 * - Counter conversion
 * - Dynamic truncation
 * - Digit truncation
 */

import { constantTimeEqual, counterToBytes, dynamicTruncate, truncateDigits } from "@otplib/core";
import { hexToBytes } from "@repo/testing";
import { Bench } from "tinybench";

const bench = new Bench({ time: 1000 });

// Test data
const token1 = "123456";
const token2 = "123456";
const token3 = "654321";
const longToken1 = "12345678";
const longToken2 = "12345678";

const bytes1 = hexToBytes("010203040506");
const bytes2 = hexToBytes("010203040506");
const bytes3 = hexToBytes("060504030201");

// Sample HMAC output (20 bytes for SHA-1)
const hmacOutput = hexToBytes("1f8698690e02ca16618550ef7f19da8e945b555a");

// Constant-time comparison benchmarks
bench
  .add("constantTimeEqual - strings (equal, 6 chars)", () => {
    constantTimeEqual(token1, token2);
  })
  .add("constantTimeEqual - strings (not equal, 6 chars)", () => {
    constantTimeEqual(token1, token3);
  })
  .add("constantTimeEqual - strings (equal, 8 chars)", () => {
    constantTimeEqual(longToken1, longToken2);
  })
  .add("constantTimeEqual - Uint8Array (equal, 6 bytes)", () => {
    constantTimeEqual(bytes1, bytes2);
  })
  .add("constantTimeEqual - Uint8Array (not equal, 6 bytes)", () => {
    constantTimeEqual(bytes1, bytes3);
  });

// Counter conversion benchmarks
bench
  .add("counterToBytes - small counter (0)", () => {
    counterToBytes(0);
  })
  .add("counterToBytes - medium counter (1000000)", () => {
    counterToBytes(1000000);
  })
  .add("counterToBytes - large counter (2^32)", () => {
    counterToBytes(4294967296);
  })
  .add("counterToBytes - bigint counter", () => {
    counterToBytes(BigInt(9007199254740991));
  });

// Dynamic truncation benchmarks
bench.add("dynamicTruncate - SHA-1 HMAC (20 bytes)", () => {
  dynamicTruncate(hmacOutput);
});

// Digit truncation benchmarks
bench
  .add("truncateDigits - 6 digits", () => {
    truncateDigits(123456789, 6);
  })
  .add("truncateDigits - 7 digits", () => {
    truncateDigits(123456789, 7);
  })
  .add("truncateDigits - 8 digits", () => {
    truncateDigits(123456789, 8);
  });

await bench.run();

console.log("\n=== Core Utilities Benchmark Results ===\n");
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
