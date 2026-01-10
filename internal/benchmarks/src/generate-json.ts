import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  constantTimeEqual,
  counterToBytes,
  dynamicTruncate,
  truncateDigits,
  stringToBytes,
  hexToBytes,
} from "@otplib/core";
import { generate as generateHOTP } from "@otplib/hotp";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { generate as generateTOTP } from "@otplib/totp";
import { Bench } from "tinybench";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, "../../../apps/docs/public/benchmarks.json");

async function runBenchmarks() {
  console.log("Starting benchmark generation...");

  // Test data
  const secret = stringToBytes("12345678901234567890"); // 20-byte secret
  const hmacOutput = hexToBytes("1f8698690e02ca16618550ef7f19da8e945b555a");

  const nodeCrypto = new NodeCryptoPlugin();
  const nobleCrypto = new NobleCryptoPlugin();
  const base32 = new ScureBase32Plugin();
  const encodedSecret = base32.encode(secret);

  const bench = new Bench({ time: 500 }); // Shorter time for CI/Build

  // Benchmark definitions matching index.ts
  bench
    .add("HOTP generate (Node.js crypto)", async () => {
      await generateHOTP({ secret, counter: 0, crypto: nodeCrypto });
    })
    .add("HOTP generate (Noble crypto)", async () => {
      await generateHOTP({ secret, counter: 0, crypto: nobleCrypto });
    })
    .add("TOTP generate (Node.js crypto)", async () => {
      await generateTOTP({ secret, crypto: nodeCrypto });
    })
    .add("TOTP generate (Noble crypto)", async () => {
      await generateTOTP({ secret, crypto: nobleCrypto });
    })
    .add("Base32 encode (20 bytes)", () => {
      base32.encode(secret);
    })
    .add("Base32 decode (32 chars)", () => {
      base32.decode(encodedSecret);
    })
    .add("constantTimeEqual (6 char strings)", () => {
      constantTimeEqual("123456", "123456");
    })
    .add("counterToBytes", () => {
      counterToBytes(1000000);
    })
    .add("dynamicTruncate", () => {
      dynamicTruncate(hmacOutput);
    })
    .add("truncateDigits (6 digits)", () => {
      truncateDigits(123456789, 6);
    });

  await bench.run();

  const results = bench.tasks.map((task) => ({
    name: task.name,
    opsPerSec: Math.round(task.result?.hz ?? 0),
    avgLatencyUs: (task.result?.mean ?? 0) * 1000,
    samples: task.result?.samples.length ?? 0,
  }));

  const data = {
    timestamp: new Date().toISOString(),
    platform: `${process.platform} ${process.arch}`,
    nodeVersion: process.version,
    results,
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2));

  console.log(`Benchmark data written to ${OUTPUT_PATH}`);
}

runBenchmarks().catch(console.error);
