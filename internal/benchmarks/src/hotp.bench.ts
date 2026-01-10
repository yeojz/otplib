/**
 * HOTP Performance Benchmarks
 *
 * Measures token generation and verification performance across different:
 * - Crypto plugins (Node.js, Noble)
 * - Hash algorithms (SHA-1, SHA-256, SHA-512)
 * - Digit lengths (6, 8)
 */

import { stringToBytes } from "@otplib/core";
import { generate, verify } from "@otplib/hotp";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { Bench } from "tinybench";

const bench = new Bench({ time: 1000 });

// Test data - 20-byte secret (recommended for SHA-1)
const secret = stringToBytes("12345678901234567890");
const counter = 0;

const nodeCrypto = new NodeCryptoPlugin();
const nobleCrypto = new NobleCryptoPlugin();

// Token Generation Benchmarks
bench
  .add("HOTP generate - Node.js crypto (SHA-1, 6 digits)", async () => {
    await generate({
      secret,
      counter,
      algorithm: "sha1",
      digits: 6,
      crypto: nodeCrypto,
    });
  })
  .add("HOTP generate - Node.js crypto (SHA-256, 6 digits)", async () => {
    await generate({
      secret,
      counter,
      algorithm: "sha256",
      digits: 6,
      crypto: nodeCrypto,
    });
  })
  .add("HOTP generate - Node.js crypto (SHA-512, 6 digits)", async () => {
    await generate({
      secret,
      counter,
      algorithm: "sha512",
      digits: 6,
      crypto: nodeCrypto,
    });
  })
  .add("HOTP generate - Node.js crypto (SHA-1, 8 digits)", async () => {
    await generate({
      secret,
      counter,
      algorithm: "sha1",
      digits: 8,
      crypto: nodeCrypto,
    });
  })
  .add("HOTP generate - Noble crypto (SHA-1, 6 digits)", async () => {
    await generate({
      secret,
      counter,
      algorithm: "sha1",
      digits: 6,
      crypto: nobleCrypto,
    });
  })
  .add("HOTP generate - Noble crypto (SHA-256, 6 digits)", async () => {
    await generate({
      secret,
      counter,
      algorithm: "sha256",
      digits: 6,
      crypto: nobleCrypto,
    });
  })
  .add("HOTP generate - Noble crypto (SHA-512, 6 digits)", async () => {
    await generate({
      secret,
      counter,
      algorithm: "sha512",
      digits: 6,
      crypto: nobleCrypto,
    });
  });

// Token Verification Benchmarks
const validToken = await generate({
  secret,
  counter,
  algorithm: "sha1",
  digits: 6,
  crypto: nodeCrypto,
});

bench
  .add("HOTP verify - Node.js crypto (no window)", async () => {
    await verify({
      secret,
      counter,
      token: validToken,
      algorithm: "sha1",
      digits: 6,
      crypto: nodeCrypto,
    });
  })
  .add("HOTP verify - Node.js crypto (window=5)", async () => {
    await verify({
      secret,
      counter,
      token: validToken,
      algorithm: "sha1",
      digits: 6,
      crypto: nodeCrypto,
      counterTolerance: 5,
    });
  })
  .add("HOTP verify - Noble crypto (no window)", async () => {
    await verify({
      secret,
      counter,
      token: validToken,
      algorithm: "sha1",
      digits: 6,
      crypto: nobleCrypto,
    });
  });

await bench.run();

console.log("\n=== HOTP Benchmark Results ===\n");
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
