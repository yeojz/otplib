/**
 * URI Parsing and Generation Performance Benchmarks
 *
 * Measures otpauth:// URI operations:
 * - Parsing with various complexity levels
 * - Generation with different parameter combinations
 * - Roundtrip performance
 */

import { parse, generate, generateTOTP, generateHOTP } from "@otplib/uri";
import { BASE_SECRET_BASE32 } from "@repo/testing";
import { Bench } from "tinybench";

const bench = new Bench({ time: 1000 });

// Test data - various URI complexities

// Simple TOTP URI (minimal params)
const simpleTotpUri = `otpauth://totp/Test?secret=${BASE_SECRET_BASE32}`;

// Standard TOTP URI (typical Google Authenticator format)
const standardTotpUri = `otpauth://totp/ACME:john@example.com?secret=${BASE_SECRET_BASE32}&issuer=ACME`;

// Full TOTP URI (all parameters specified)
const fullTotpUri = `otpauth://totp/ACME:john@example.com?secret=${BASE_SECRET_BASE32}&issuer=ACME&algorithm=SHA256&digits=8&period=60`;

// HOTP URI with counter
const hotpUri = `otpauth://hotp/ACME:john@example.com?secret=${BASE_SECRET_BASE32}&issuer=ACME&counter=42`;

// URI with URL-encoded characters
const encodedUri = `otpauth://totp/My%20Service:user%40example.com?secret=${BASE_SECRET_BASE32}&issuer=My%20Service`;

// Long secret (64 bytes base32 encoded)
const longSecretUri = `otpauth://totp/Test?secret=${BASE_SECRET_BASE32.repeat(6)}`;

// Parsed URI objects for generation benchmarks
const parsedSimple = parse(simpleTotpUri);
const parsedStandard = parse(standardTotpUri);
const parsedFull = parse(fullTotpUri);
const parsedHotp = parse(hotpUri);

// Parsing Benchmarks
bench
  .add("URI parse - simple TOTP", () => {
    parse(simpleTotpUri);
  })
  .add("URI parse - standard TOTP (issuer:account)", () => {
    parse(standardTotpUri);
  })
  .add("URI parse - full TOTP (all params)", () => {
    parse(fullTotpUri);
  })
  .add("URI parse - HOTP with counter", () => {
    parse(hotpUri);
  })
  .add("URI parse - URL-encoded characters", () => {
    parse(encodedUri);
  })
  .add("URI parse - long secret", () => {
    parse(longSecretUri);
  });

// Generation Benchmarks
bench
  .add("URI generate - simple", () => {
    generate(parsedSimple);
  })
  .add("URI generate - standard", () => {
    generate(parsedStandard);
  })
  .add("URI generate - full params", () => {
    generate(parsedFull);
  })
  .add("URI generate - HOTP", () => {
    generate(parsedHotp);
  });

// Helper function generation
bench
  .add("URI generateTOTP helper", () => {
    generateTOTP({
      issuer: "ACME",
      label: "john@example.com",
      secret: BASE_SECRET_BASE32,
      algorithm: "sha256",
      digits: 8,
      period: 60,
    });
  })
  .add("URI generateHOTP helper", () => {
    generateHOTP({
      issuer: "ACME",
      label: "john@example.com",
      secret: BASE_SECRET_BASE32,
      counter: 42,
    });
  });

// Roundtrip Benchmarks
bench
  .add("URI roundtrip - parse then generate", () => {
    const parsed = parse(standardTotpUri);
    generate(parsed);
  })
  .add("URI roundtrip - generate then parse", () => {
    const generated = generateTOTP({
      issuer: "Test",
      label: "user@test.com",
      secret: BASE_SECRET_BASE32,
    });
    parse(generated);
  });

await bench.run();

console.log("\n=== URI Benchmark Results ===\n");
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
