/**
 * otplib Performance Benchmarks
 *
 * Runs all benchmark suites and outputs a summary.
 *
 * Usage:
 *   pnpm --filter @repo/benchmarks bench
 *
 * Individual suites:
 *   pnpm --filter @repo/benchmarks bench:hotp
 *   pnpm --filter @repo/benchmarks bench:totp
 *   pnpm --filter @repo/benchmarks bench:base32
 *   pnpm --filter @repo/benchmarks bench:utils
 *   pnpm --filter @repo/benchmarks bench:uri
 */

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
import {
  parse as parseURI,
  generate as generateURI,
  generateTOTP as generateTOTPUri,
} from "@otplib/uri";
import { BASE_SECRET_BASE32 } from "@repo/testing";
import { Bench } from "tinybench";

console.log("=".repeat(60));
console.log("otplib Performance Benchmarks");
console.log("=".repeat(60));
console.log(`Node.js ${process.version}`);
console.log(`Platform: ${process.platform} ${process.arch}`);
console.log("=".repeat(60));

// Test data
const secret = stringToBytes("12345678901234567890");
const hmacOutput = hexToBytes("1f8698690e02ca16618550ef7f19da8e945b555a");

const nodeCrypto = new NodeCryptoPlugin();
const nobleCrypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();
const encodedSecret = base32.encode(secret);

// URI test data
const standardTotpUri = `otpauth://totp/ACME:john@example.com?secret=${BASE_SECRET_BASE32}&issuer=ACME`;
const parsedUri = parseURI(standardTotpUri);

const bench = new Bench({ time: 1000 });

// Token Generation
bench
  .add("HOTP generate (Node.js crypto)", async () => {
    await generateHOTP({
      secret,
      counter: 0,
      crypto: nodeCrypto,
    });
  })
  .add("HOTP generate (Noble crypto)", async () => {
    await generateHOTP({
      secret,
      counter: 0,
      crypto: nobleCrypto,
    });
  })
  .add("TOTP generate (Node.js crypto)", async () => {
    await generateTOTP({
      secret,
      crypto: nodeCrypto,
    });
  })
  .add("TOTP generate (Noble crypto)", async () => {
    await generateTOTP({
      secret,
      crypto: nobleCrypto,
    });
  });

// Base32
bench
  .add("Base32 encode (20 bytes)", () => {
    base32.encode(secret);
  })
  .add("Base32 decode (32 chars)", () => {
    base32.decode(encodedSecret);
  });

// URI operations
bench
  .add("URI parse (standard TOTP)", () => {
    parseURI(standardTotpUri);
  })
  .add("URI generate", () => {
    generateURI(parsedUri);
  })
  .add("URI generateTOTP helper", () => {
    generateTOTPUri({
      issuer: "ACME",
      label: "john@example.com",
      secret: BASE_SECRET_BASE32,
    });
  })
  .add("URI roundtrip (parse + generate)", () => {
    const parsed = parseURI(standardTotpUri);
    generateURI(parsed);
  });

// Low-level utils
bench
  .add("constantTimeEqual (strings)", () => {
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

console.log("\n=== Summary Results ===\n");
console.table(
  bench.tasks.map((task) => ({
    Operation: task.name,
    "Ops/sec": Math.round(task.result?.hz ?? 0).toLocaleString(),
    "Avg (μs)": ((task.result?.mean ?? 0) * 1000).toFixed(2),
    Samples: task.result?.samples.length,
  })),
);

// Calculate and display key metrics
console.log("\n=== Key Metrics ===\n");

const hotpNode = bench.tasks.find((t) => t.name.includes("HOTP") && t.name.includes("Node"));
const hotpNoble = bench.tasks.find((t) => t.name.includes("HOTP") && t.name.includes("Noble"));
const totpNode = bench.tasks.find((t) => t.name.includes("TOTP") && t.name.includes("Node"));
const totpNoble = bench.tasks.find((t) => t.name.includes("TOTP") && t.name.includes("Noble"));

if (hotpNode?.result && hotpNoble?.result) {
  const ratio = hotpNode.result.hz / hotpNoble.result.hz;
  console.log(`Node.js vs Noble (HOTP): ${ratio.toFixed(2)}x`);
}

if (totpNode?.result && totpNoble?.result) {
  const ratio = totpNode.result.hz / totpNoble.result.hz;
  console.log(`Node.js vs Noble (TOTP): ${ratio.toFixed(2)}x`);
}

console.log("\nBenchmark complete!");
