import { test } from "node:test";
import assert from "node:assert";
import type { TOTPOptions, HOTPOptions, VerifyResult } from "otplib";
import { generateSecret, generate, verify, generateURI } from "otplib";
import * as totp from "@otplib/totp";
import * as hotp from "@otplib/hotp";
import * as uri from "@otplib/uri";
import * as core from "@otplib/core";
import { base32, type ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { crypto as nobleCrypto, NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { crypto as nodeCrypto, NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import type { Base32Plugin, CryptoPlugin } from "@otplib/core";

test("otplib types - TOTPOptions and basic TOTP types", async () => {
  const secret: string = generateSecret();

  const totpOptions: TOTPOptions = {
    secret,
    algorithm: "sha1",
    digits: 6,
    step: 30,
  };

  const token: string = await generate(totpOptions);
  const result: VerifyResult = await verify({ secret, token });
  const isValid: boolean = result.valid;

  assert.strictEqual(typeof token, "string");
  assert.strictEqual(typeof isValid, "boolean");
  assert.ok(result.valid);
});

test("otplib types - HOTPOptions and HOTP types", async () => {
  const secret = generateSecret();

  const hotpOptions: HOTPOptions = {
    secret,
    counter: 0,
    algorithm: "sha256",
    digits: 8,
    strategy: "hotp",
  };

  const token: string = await generate(hotpOptions);
  const result: VerifyResult = await verify({
    ...hotpOptions,
    token,
  });

  assert.strictEqual(typeof token, "string");
  assert.ok(result.valid);
  assert.strictEqual(typeof result.delta, "number");
});

test("otplib types - GenerateURI types", () => {
  const secret = generateSecret();

  const otpauthURI: string = generateURI({
    type: "totp",
    label: "user@example.com",
    secret,
    issuer: "TestApp",
  });

  const parsed = uri.parse(otpauthURI);

  assert.strictEqual(typeof otpauthURI, "string");
  assert.strictEqual(parsed.type, "totp");
  assert.strictEqual(parsed.secret, secret);
  assert.strictEqual(parsed.issuer, "TestApp");
});

test("@otplib/totp types - can use all TOTP exports", async () => {
  const secret = core.generateSecret();
  const token = await totp.generate({ secret });
  const result = await totp.verify({ secret, token });

  assert.strictEqual(typeof secret, "string");
  assert.strictEqual(typeof token, "string");
  assert.ok(result.valid);
});

test("@otplib/hotp types - can use all HOTP exports", async () => {
  const token = await hotp.generate({ secret: "TEST", counter: 0 });
  const result = await hotp.verify({ secret: "TEST", counter: 0, token });

  assert.strictEqual(typeof token, "string");
  assert.ok(result.valid);
});

test("@otplib/uri types - can use URI parsing functions", () => {
  const testURI = "otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example";
  const parsed = uri.parse(testURI);

  assert.strictEqual(parsed.type, "totp");
  assert.strictEqual(parsed.secret, "JBSWY3DPEHPK3PXP");
  assert.strictEqual(parsed.issuer, "Example");
  assert.strictEqual(parsed.label, "Example:user@example.com");
});

test("@otplib/uri types - can generate URIs", () => {
  const totpURI = uri.generateTOTP({
    label: "user@example.com",
    secret: "JBSWY3DPEHPK3PXP",
    issuer: "Example",
  });

  const hotpURI = uri.generateHOTP({
    label: "user@example.com",
    secret: "JBSWY3DPEHPK3PXP",
    issuer: "Example",
    counter: 0,
  });

  assert.ok(totpURI.startsWith("otpauth://totp/"));
  assert.ok(hotpURI.startsWith("otpauth://hotp/"));
});

test("@otplib/core types - can use core utilities", () => {
  const secret = "JBSWY3DPEHPK3PXP";

  const generatedSecret: string = core.generateSecret();
  assert.strictEqual(typeof generatedSecret, "string");

  const normalized = core.normalizeSecret(secret);
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

test("plugin types - crypto plugins can create HMAC", () => {
  const key = new Uint8Array([1, 2, 3, 4, 5]);
  const data = new Uint8Array([10, 20, 30]);

  const nobleHmac = nobleCrypto.hmac("sha1", key, data);
  const nodeHmac = nodeCrypto.hmac("sha1", key, data);

  assert.ok(nobleHmac instanceof Uint8Array);
  assert.ok(nodeHmac instanceof Uint8Array);
  assert.ok(nobleHmac.length > 0);
  assert.ok(nodeHmac.length > 0);
});
