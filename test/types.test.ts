import { test } from "node:test";
import assert from "node:assert";
import type { TOTPOptions, HOTPOptions, VerifyResult, GenerateURIOptions } from "otplib";
import { generateSecret, generate, verify, generateURI } from "otplib";
import * as totp from "@otplib/totp";
import * as hotp from "@otplib/hotp";
import * as uri from "@otplib/uri";
import * as core from "@otplib/core";
import type { Base32Plugin } from "@otplib/plugin-base32-scure";
import type { CryptoPlugin } from "@otplib/plugin-crypto-noble";
import * as base32Plugin from "@otplib/plugin-base32-scure";
import * as cryptoNoblePlugin from "@otplib/plugin-crypto-noble";
import * as cryptoNodePlugin from "@otplib/plugin-crypto-node";

test("otplib types - TOTPOptions and basic TOTP types", async () => {
  const secret: string = generateSecret();

  const totpOptions: TOTPOptions = {
    secret,
    algorithm: "SHA1",
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
    algorithm: "SHA256",
    digits: 8,
  };

  const token: string = await hotp.generate(hotpOptions);
  const result: VerifyResult = await hotp.verify({
    ...hotpOptions,
    token,
  });

  assert.strictEqual(typeof token, "string");
  assert.ok(result.valid);
  assert.strictEqual(typeof result.delta, "number");
});

test("otplib types - GenerateURIOptions and URI types", () => {
  const secret = generateSecret();

  const uriOptions: GenerateURIOptions = {
    type: "totp",
    label: "user@example.com",
    secret,
    issuer: "TestApp",
    algorithm: "SHA512",
    digits: 6,
    step: 30,
  };

  const otpauthURI: string = generateURI(uriOptions);
  const parsed = uri.parse(otpauthURI);

  assert.strictEqual(typeof otpauthURI, "string");
  assert.strictEqual(parsed.type, "totp");
  assert.strictEqual(parsed.secret, secret);
  assert.strictEqual(parsed.issuer, "TestApp");
});

test("@otplib/totp types - can use all TOTP exports", async () => {
  const secret = totp.generateSecret();
  const token = await totp.generate({ secret });
  const result = await totp.verify({ secret, token });
  const uri = totp.generateURI({
    type: "totp",
    label: "test",
    secret,
  });

  assert.strictEqual(typeof secret, "string");
  assert.strictEqual(typeof token, "string");
  assert.ok(result.valid);
  assert.ok(uri.startsWith("otpauth://totp/"));
});

test("@otplib/hotp types - can use all HOTP exports", async () => {
  const token = await hotp.generate({ secret: "TEST", counter: 0 });
  const result = await hotp.verify({ secret: "TEST", counter: 0, token });
  const uri = hotp.generateURI({
    type: "hotp",
    label: "test",
    secret: "TEST",
    counter: 0,
  });

  assert.strictEqual(typeof token, "string");
  assert.ok(result.valid);
  assert.ok(uri.startsWith("otpauth://hotp/"));
});

test("@otplib/uri types - can use URI parsing functions", () => {
  const testURI = "otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example";
  const parsed = uri.parse(testURI);

  assert.strictEqual(parsed.type, "totp");
  assert.strictEqual(parsed.secret, "JBSWY3DPEHPK3PXP");
  assert.strictEqual(parsed.issuer, "Example");
  assert.strictEqual(parsed.label, "Example:user@example.com");
});

test("@otplib/core types - can use core utilities", () => {
  const secret = "JBSWY3DPEHPK3PXP";
  const isValid: boolean = core.isValidSecret(secret);

  assert.strictEqual(typeof isValid, "boolean");
  assert.ok(isValid);

  const window = core.totpWindow({ step: 30, window: 1 });
  assert.strictEqual(typeof window.past, "number");
  assert.strictEqual(typeof window.future, "number");
});

test("plugin types - Base32Plugin type compatibility", () => {
  const plugin: Base32Plugin = {
    base32Decode: base32Plugin.base32Decode,
    base32Encode: base32Plugin.base32Encode,
  };

  const encoded = plugin.base32Encode("test");
  const decoded = plugin.base32Decode(encoded);

  assert.strictEqual(typeof encoded, "string");
  assert.strictEqual(decoded, "test");
});

test("plugin types - CryptoPlugin type compatibility", async () => {
  const noblePlugin: CryptoPlugin = {
    createHmac: cryptoNoblePlugin.createHmac,
    randomBytes: cryptoNoblePlugin.randomBytes,
  };

  const nodePlugin: CryptoPlugin = {
    createHmac: cryptoNodePlugin.createHmac,
    randomBytes: cryptoNodePlugin.randomBytes,
  };

  const bytes1 = await noblePlugin.randomBytes(16);
  const bytes2 = await nodePlugin.randomBytes(16);

  assert.ok(bytes1 instanceof Uint8Array);
  assert.ok(bytes2 instanceof Uint8Array);
  assert.strictEqual(bytes1.length, 16);
  assert.strictEqual(bytes2.length, 16);
});

test("plugin types - crypto plugins can create HMAC", async () => {
  const key = new Uint8Array([1, 2, 3, 4, 5]);
  const data = new Uint8Array([10, 20, 30]);

  const nobleHmac = await cryptoNoblePlugin.createHmac("SHA1", key, data);
  const nodeHmac = await cryptoNodePlugin.createHmac("SHA1", key, data);

  assert.ok(nobleHmac instanceof Uint8Array);
  assert.ok(nodeHmac instanceof Uint8Array);
  assert.ok(nobleHmac.length > 0);
  assert.ok(nodeHmac.length > 0);
});
