import { test } from "node:test";
import assert from "node:assert";

test("otplib main bundle - can import and generate TOTP", async () => {
  const { generateSecret, generate, verify } = await import("otplib");

  const secret = generateSecret();
  assert.ok(secret, "Secret should be generated");
  assert.strictEqual(typeof secret, "string", "Secret should be a string");

  const token = await generate({ secret });
  assert.ok(token, "Token should be generated");
  assert.strictEqual(typeof token, "string", "Token should be a string");
  assert.strictEqual(token.length, 6, "Token should be 6 digits by default");

  const result = await verify({ secret, token });
  assert.ok(result.valid, "Token should be valid");
});

test("@otplib/totp - can import and use TOTP functions", async () => {
  const totp = await import("@otplib/totp");

  assert.ok(totp.generateSecret, "generateSecret should be exported");
  assert.ok(totp.generate, "generate should be exported");
  assert.ok(totp.verify, "verify should be exported");

  const secret = totp.generateSecret();
  const token = await totp.generate({ secret });
  const result = await totp.verify({ secret, token });

  assert.ok(result.valid, "Generated token should be valid");
});

test("@otplib/hotp - can import and use HOTP functions", async () => {
  const hotp = await import("@otplib/hotp");

  assert.ok(hotp.generate, "generate should be exported");
  assert.ok(hotp.verify, "verify should be exported");

  const secret = "JBSWY3DPEHPK3PXP";
  const counter = 0;

  const token = await hotp.generate({ secret, counter });
  assert.ok(token, "Token should be generated");
  assert.strictEqual(typeof token, "string", "Token should be a string");

  const result = await hotp.verify({ secret, counter, token });
  assert.ok(result.valid, "Generated token should be valid");
});

test("@otplib/uri - can parse and generate otpauth URIs", async () => {
  const uri = await import("@otplib/uri");

  assert.ok(uri.parse, "parse should be exported");
  assert.ok(uri.generateURI, "generateURI should be exported");

  const otpauthURI = uri.generateURI({
    type: "totp",
    label: "test@example.com",
    secret: "JBSWY3DPEHPK3PXP",
    issuer: "TestApp",
  });

  assert.ok(otpauthURI.startsWith("otpauth://totp/"), "URI should start with otpauth://totp/");
  assert.ok(otpauthURI.includes("secret=JBSWY3DPEHPK3PXP"), "URI should contain secret");
  assert.ok(otpauthURI.includes("issuer=TestApp"), "URI should contain issuer");

  const parsed = uri.parse(otpauthURI);
  assert.strictEqual(parsed.type, "totp", "Parsed type should be totp");
  assert.strictEqual(parsed.secret, "JBSWY3DPEHPK3PXP", "Parsed secret should match");
  assert.strictEqual(parsed.issuer, "TestApp", "Parsed issuer should match");
});

test("@otplib/core - can import core utilities", async () => {
  const core = await import("@otplib/core");

  assert.ok(core.isValidSecret, "isValidSecret should be exported");
  assert.ok(core.totpWindow, "totpWindow should be exported");
});

test("plugins - can import and use crypto plugins", async () => {
  const noble = await import("@otplib/plugin-crypto-noble");
  const node = await import("@otplib/plugin-crypto-node");

  assert.ok(noble.createHmac, "noble plugin should export createHmac");
  assert.ok(node.createHmac, "node plugin should export createHmac");
});

test("plugins - can import and use base32 plugin", async () => {
  const base32 = await import("@otplib/plugin-base32-scure");

  assert.ok(base32.base32Decode, "base32 plugin should export base32Decode");
  assert.ok(base32.base32Encode, "base32 plugin should export base32Encode");

  const encoded = base32.base32Encode("hello");
  assert.ok(encoded, "Should encode string");
  assert.strictEqual(typeof encoded, "string", "Encoded value should be string");

  const decoded = base32.base32Decode(encoded);
  assert.ok(decoded, "Should decode string");
  assert.strictEqual(decoded, "hello", "Decoded value should match original");
});
