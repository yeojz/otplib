/**
 * CommonJS smoke test for otplib packages
 *
 * This tests that packages can be required using CommonJS syntax.
 * Uses .cjs extension to run as CommonJS in ESM project.
 */

const { test } = require("node:test");
const assert = require("node:assert");

// 32-byte secret to meet v13.0.0 minimum 16-byte requirement
const TEST_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

test("CJS: otplib main bundle - can require and generate TOTP", async () => {
  const otplib = require("otplib");
  const { crypto } = require("@otplib/plugin-crypto-node");

  assert.ok(otplib.generateSecret, "generateSecret should be exported");
  assert.ok(otplib.generate, "generate should be exported");
  assert.ok(otplib.verify, "verify should be exported");

  const secret = otplib.generateSecret({ crypto });
  assert.ok(secret, "Secret should be generated");
  assert.strictEqual(typeof secret, "string", "Secret should be a string");

  const token = await otplib.generate({ secret, crypto });
  assert.ok(token, "Token should be generated");
  assert.strictEqual(token.length, 6, "Token should be 6 digits");

  const result = await otplib.verify({ secret, token, crypto });
  assert.ok(result.valid, "Token should be valid");
});

test("CJS: @otplib/totp - can require and use TOTP", async () => {
  const totp = require("@otplib/totp");
  const { crypto } = require("@otplib/plugin-crypto-node");
  const { base32 } = require("@otplib/plugin-base32-scure");

  const token = await totp.generate({ secret: TEST_SECRET, crypto, base32 });
  assert.strictEqual(typeof token, "string", "Token should be a string");

  const result = await totp.verify({
    secret: TEST_SECRET,
    token,
    crypto,
    base32,
  });
  assert.ok(result.valid, "Token should be valid");
});

test("CJS: @otplib/hotp - can require and use HOTP", async () => {
  const hotp = require("@otplib/hotp");
  const { crypto } = require("@otplib/plugin-crypto-node");
  const { base32 } = require("@otplib/plugin-base32-scure");

  const token = await hotp.generate({
    secret: TEST_SECRET,
    counter: 0,
    crypto,
    base32,
  });
  assert.strictEqual(typeof token, "string", "Token should be a string");

  const result = await hotp.verify({
    secret: TEST_SECRET,
    counter: 0,
    token,
    crypto,
    base32,
  });
  assert.ok(result.valid, "Token should be valid");
});

test("CJS: @otplib/uri - can require and use URI functions", () => {
  const uri = require("@otplib/uri");

  const otpauthURI = uri.generateTOTP({
    label: "test@example.com",
    secret: TEST_SECRET,
    issuer: "TestApp",
  });

  assert.ok(
    otpauthURI.startsWith("otpauth://totp/"),
    "Should generate TOTP URI"
  );

  const parsed = uri.parse(otpauthURI);
  assert.strictEqual(parsed.type, "totp", "Parsed type should be totp");
  assert.strictEqual(parsed.params.secret, TEST_SECRET, "Secret should match");
});

test("CJS: @otplib/core - can require core utilities", () => {
  const core = require("@otplib/core");
  const { crypto } = require("@otplib/plugin-crypto-node");
  const { base32 } = require("@otplib/plugin-base32-scure");

  assert.ok(core.generateSecret, "generateSecret should be exported");
  assert.ok(core.validateSecret, "validateSecret should be exported");
  assert.ok(core.normalizeSecret, "normalizeSecret should be exported");

  const secret = core.generateSecret({ crypto, base32 });
  assert.strictEqual(typeof secret, "string", "Secret should be a string");
});

test("CJS: plugins - can require crypto plugins", () => {
  const noble = require("@otplib/plugin-crypto-noble");
  const node = require("@otplib/plugin-crypto-node");

  assert.ok(noble.crypto, "noble plugin should export crypto");
  assert.ok(noble.NobleCryptoPlugin, "noble should export class");
  assert.ok(node.crypto, "node plugin should export crypto");
  assert.ok(node.NodeCryptoPlugin, "node should export class");

  const key = new Uint8Array([1, 2, 3, 4, 5]);
  const data = new Uint8Array([10, 20, 30]);

  const hmac = node.crypto.hmac("sha1", key, data);
  assert.ok(hmac instanceof Uint8Array, "HMAC should return Uint8Array");
});

test("CJS: plugins - can require base32 plugin", () => {
  const base32Pkg = require("@otplib/plugin-base32-scure");

  assert.ok(base32Pkg.base32, "Should export base32 singleton");
  assert.ok(base32Pkg.ScureBase32Plugin, "Should export class");

  const testData = new TextEncoder().encode("hello");
  const encoded = base32Pkg.base32.encode(testData);
  const decoded = base32Pkg.base32.decode(encoded);

  assert.strictEqual(typeof encoded, "string", "Encoded should be string");
  assert.ok(decoded instanceof Uint8Array, "Decoded should be Uint8Array");
});
