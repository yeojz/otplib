import { test } from "node:test";
import assert from "node:assert";
import * as totp from "@otplib/totp";
import * as hotp from "@otplib/hotp";
import * as uri from "@otplib/uri";
import * as core from "@otplib/core";
import { base32, ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import {
  crypto as nobleCrypto,
  NobleCryptoPlugin,
} from "@otplib/plugin-crypto-noble";
import {
  crypto as nodeCrypto,
  NodeCryptoPlugin,
} from "@otplib/plugin-crypto-node";
import type { Base32Plugin, CryptoPlugin } from "@otplib/core";
import type { TOTPGenerateOptions, VerifyResult } from "@otplib/totp";
import type { HOTPGenerateOptions } from "@otplib/hotp";

// Use node crypto and scure base32 for tests
const crypto = nodeCrypto;

// v13.0.0 requires secrets to be at least 16 bytes (128 bits)
// Use a 32-byte secret to ensure compliance
const TEST_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

test("@otplib/totp types - TOTPGenerateOptions and basic TOTP types", async () => {
  const totpOptions: TOTPGenerateOptions = {
    secret: TEST_SECRET,
    algorithm: "sha1",
    digits: 6,
    period: 30,
    crypto,
    base32,
  };

  const token: string = await totp.generate(totpOptions);
  const result: VerifyResult = await totp.verify({ ...totpOptions, token });
  const isValid: boolean = result.valid;

  assert.strictEqual(typeof token, "string");
  assert.strictEqual(typeof isValid, "boolean");
  assert.ok(result.valid);
});

test("@otplib/hotp types - HOTPGenerateOptions and HOTP types", async () => {
  const hotpOptions: HOTPGenerateOptions = {
    secret: TEST_SECRET,
    counter: 0,
    algorithm: "sha256",
    digits: 8,
    crypto,
    base32,
  };

  const token: string = await hotp.generate(hotpOptions);
  const result = await hotp.verify({
    ...hotpOptions,
    token,
  });

  assert.strictEqual(typeof token, "string");
  assert.ok(result.valid);
  if (result.valid) {
    assert.strictEqual(typeof result.delta, "number");
  }
});

test("@otplib/uri types - can parse and generate URIs", () => {
  const totpURI = uri.generateTOTP({
    label: "user@example.com",
    secret: TEST_SECRET,
    issuer: "TestApp",
  });

  const parsed = uri.parse(totpURI);

  assert.strictEqual(typeof totpURI, "string");
  assert.strictEqual(parsed.type, "totp");
  assert.strictEqual(parsed.params.secret, TEST_SECRET);
  assert.strictEqual(parsed.params.issuer, "TestApp");
});

test("@otplib/totp types - can use all TOTP exports", async () => {
  const token = await totp.generate({ secret: TEST_SECRET, crypto, base32 });
  const result = await totp.verify({
    secret: TEST_SECRET,
    token,
    crypto,
    base32,
  });

  assert.strictEqual(typeof token, "string");
  assert.ok(result.valid);
});

test("@otplib/hotp types - can use all HOTP exports", async () => {
  const token = await hotp.generate({
    secret: TEST_SECRET,
    counter: 0,
    crypto,
    base32,
  });
  const result = await hotp.verify({
    secret: TEST_SECRET,
    counter: 0,
    token,
    crypto,
    base32,
  });

  assert.strictEqual(typeof token, "string");
  assert.ok(result.valid);
});

test("@otplib/uri types - can use URI parsing functions", () => {
  const testURI = `otpauth://totp/Example:user@example.com?secret=${TEST_SECRET}&issuer=Example`;
  const parsed = uri.parse(testURI);

  assert.strictEqual(parsed.type, "totp");
  assert.strictEqual(parsed.params.secret, TEST_SECRET);
  assert.strictEqual(parsed.params.issuer, "Example");
  assert.strictEqual(parsed.label, "Example:user@example.com");
});

test("@otplib/uri types - can generate URIs", () => {
  const totpURI = uri.generateTOTP({
    label: "user@example.com",
    secret: TEST_SECRET,
    issuer: "Example",
  });

  const hotpURI = uri.generateHOTP({
    label: "user@example.com",
    secret: TEST_SECRET,
    issuer: "Example",
    counter: 0,
  });

  assert.ok(totpURI.startsWith("otpauth://totp/"));
  assert.ok(hotpURI.startsWith("otpauth://hotp/"));
});

test("@otplib/core types - can use core utilities", () => {
  const generatedSecret: string = core.generateSecret({ crypto, base32 });
  assert.strictEqual(typeof generatedSecret, "string");

  const normalized = core.normalizeSecret(TEST_SECRET, base32);
  assert.ok(normalized instanceof Uint8Array);

  core.validateSecret(normalized);
  assert.ok(true, "validateSecret should not throw");
});

test("plugin types - Base32Plugin interface compliance", () => {
  const testData = new TextEncoder().encode("test");

  const plugin: Base32Plugin = base32;
  const encoded = plugin.encode(testData);
  const decoded = plugin.decode(encoded);

  assert.strictEqual(typeof encoded, "string");
  assert.ok(decoded instanceof Uint8Array);
});

test("plugin types - CryptoPlugin interface compliance (noble)", () => {
  const key = new Uint8Array([1, 2, 3, 4, 5]);
  const data = new Uint8Array([10, 20, 30]);

  const plugin: CryptoPlugin = nobleCrypto;
  const hmacResult = plugin.hmac("sha1", key, data);
  const randomResult = plugin.randomBytes(16);
  const compareResult = plugin.constantTimeEqual("test", "test");

  assert.ok(hmacResult instanceof Uint8Array);
  assert.ok(randomResult instanceof Uint8Array);
  assert.strictEqual(typeof compareResult, "boolean");
});

test("plugin types - CryptoPlugin interface compliance (node)", () => {
  const key = new Uint8Array([1, 2, 3, 4, 5]);
  const data = new Uint8Array([10, 20, 30]);

  const plugin: CryptoPlugin = nodeCrypto;
  const hmacResult = plugin.hmac("sha1", key, data);
  const randomResult = plugin.randomBytes(16);
  const compareResult = plugin.constantTimeEqual("test", "test");

  assert.ok(hmacResult instanceof Uint8Array);
  assert.ok(randomResult instanceof Uint8Array);
  assert.strictEqual(typeof compareResult, "boolean");
});

test("plugin types - Plugin class instantiation", () => {
  const base32Instance = new ScureBase32Plugin();
  const nobleInstance = new NobleCryptoPlugin();
  const nodeInstance = new NodeCryptoPlugin();

  assert.strictEqual(base32Instance.name, "scure");
  assert.strictEqual(nobleInstance.name, "noble");
  assert.strictEqual(nodeInstance.name, "node");
});

test("plugin types - crypto plugins can create HMAC", async () => {
  const key = new Uint8Array([1, 2, 3, 4, 5]);
  const data = new Uint8Array([10, 20, 30]);

  // hmac can return Uint8Array or Promise<Uint8Array>
  const nobleHmac = await Promise.resolve(nobleCrypto.hmac("sha1", key, data));
  const nodeHmac = await Promise.resolve(nodeCrypto.hmac("sha1", key, data));

  assert.ok(nobleHmac instanceof Uint8Array);
  assert.ok(nodeHmac instanceof Uint8Array);
  assert.ok(nobleHmac.length > 0);
  assert.ok(nodeHmac.length > 0);
});
