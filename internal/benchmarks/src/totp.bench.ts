/**
 * TOTP Performance Benchmarks
 *
 * Measures time-based token generation and verification performance.
 */

import { stringToBytes } from "@otplib/core";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { generate, verify } from "@otplib/totp";
import { Bench } from "tinybench";

const bench = new Bench({ time: 1000 });

// Test data - 20-byte secret (recommended for SHA-1)
const secret = stringToBytes("12345678901234567890");

const nodeCrypto = new NodeCryptoPlugin();
const nobleCrypto = new NobleCryptoPlugin();

// Token Generation Benchmarks
bench
  .add("TOTP generate - Node.js crypto (SHA-1, 30s period)", async () => {
    await generate({
      secret,
      algorithm: "sha1",
      digits: 6,
      period: 30,
      crypto: nodeCrypto,
    });
  })
  .add("TOTP generate - Node.js crypto (SHA-256, 30s period)", async () => {
    await generate({
      secret,
      algorithm: "sha256",
      digits: 6,
      period: 30,
      crypto: nodeCrypto,
    });
  })
  .add("TOTP generate - Node.js crypto (SHA-512, 30s period)", async () => {
    await generate({
      secret,
      algorithm: "sha512",
      digits: 6,
      period: 30,
      crypto: nodeCrypto,
    });
  })
  .add("TOTP generate - Node.js crypto (SHA-1, 60s period)", async () => {
    await generate({
      secret,
      algorithm: "sha1",
      digits: 6,
      period: 60,
      crypto: nodeCrypto,
    });
  })
  .add("TOTP generate - Noble crypto (SHA-1, 30s period)", async () => {
    await generate({
      secret,
      algorithm: "sha1",
      digits: 6,
      period: 30,
      crypto: nobleCrypto,
    });
  })
  .add("TOTP generate - Noble crypto (SHA-256, 30s period)", async () => {
    await generate({
      secret,
      algorithm: "sha256",
      digits: 6,
      period: 30,
      crypto: nobleCrypto,
    });
  })
  .add("TOTP generate - Noble crypto (SHA-512, 30s period)", async () => {
    await generate({
      secret,
      algorithm: "sha512",
      digits: 6,
      period: 30,
      crypto: nobleCrypto,
    });
  });

// Token Verification Benchmarks
const validToken = await generate({
  secret,
  algorithm: "sha1",
  digits: 6,
  period: 30,
  crypto: nodeCrypto,
});

bench
  .add("TOTP verify - Node.js crypto (no window)", async () => {
    await verify({
      secret,
      token: validToken,
      algorithm: "sha1",
      digits: 6,
      period: 30,
      crypto: nodeCrypto,
    });
  })
  .add("TOTP verify - Node.js crypto (window=1)", async () => {
    await verify({
      secret,
      token: validToken,
      algorithm: "sha1",
      digits: 6,
      period: 30,
      crypto: nodeCrypto,
      epochTolerance: 30,
    });
  })
  .add("TOTP verify - Node.js crypto (window=2)", async () => {
    await verify({
      secret,
      token: validToken,
      algorithm: "sha1",
      digits: 6,
      period: 30,
      crypto: nodeCrypto,
      epochTolerance: 60,
    });
  })
  .add("TOTP verify - Noble crypto (no window)", async () => {
    await verify({
      secret,
      token: validToken,
      algorithm: "sha1",
      digits: 6,
      period: 30,
      crypto: nobleCrypto,
    });
  });

await bench.run();

console.log("\n=== TOTP Benchmark Results ===\n");
console.table(
  bench.tasks.map((task) => ({
    Name: task.name,
    "Ops/sec": task.result?.hz.toFixed(2),
    "Avg (ms)": task.result?.mean.toFixed(4),
    "Min (ms)": task.result?.min.toFixed(4),
    "Max (ms)": task.result?.max.toFixed(4),
    Samples: task.result?.samples.length,
  })),
);
