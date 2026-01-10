import { test } from "node:test";
import assert from "node:assert";

// v13.0.0 API requires explicit crypto AND base32 plugins for string secrets
// Secrets must be at least 16 bytes (128 bits) - use GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ (32 bytes)
const TEST_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

test("otplib main bundle - can import and generate TOTP", async () => {
  const otplib = await import("otplib");
  const { crypto } = await import("@otplib/plugin-crypto-node");

  // Check main exports exist
  assert.ok(otplib.generateSecret, "generateSecret should be exported");
  assert.ok(otplib.generate, "generate should be exported");
  assert.ok(otplib.verify, "verify should be exported");
  assert.ok(otplib.generateURI, "generateURI should be exported");

  const secret = otplib.generateSecret({ crypto });
  assert.ok(secret, "Secret should be generated");
  assert.strictEqual(typeof secret, "string", "Secret should be a string");

  const token = await otplib.generate({ secret, crypto });
  assert.ok(token, "Token should be generated");
  assert.strictEqual(typeof token, "string", "Token should be a string");
  assert.strictEqual(token.length, 6, "Token should be 6 digits by default");

  const result = await otplib.verify({ secret, token, crypto });
  assert.ok(result.valid, "Token should be valid");
});

test("@otplib/totp - can import and use TOTP functions", async () => {
  const totp = await import("@otplib/totp");
  const { crypto } = await import("@otplib/plugin-crypto-node");
  const { base32 } = await import("@otplib/plugin-base32-scure");

  assert.ok(totp.generate, "generate should be exported");
  assert.ok(totp.verify, "verify should be exported");

  const token = await totp.generate({ secret: TEST_SECRET, crypto, base32 });
  const result = await totp.verify({
    secret: TEST_SECRET,
    token,
    crypto,
    base32,
  });

  assert.ok(result.valid, "Generated token should be valid");
});

test("@otplib/hotp - can import and use HOTP functions", async () => {
  const hotp = await import("@otplib/hotp");
  const { crypto } = await import("@otplib/plugin-crypto-node");
  const { base32 } = await import("@otplib/plugin-base32-scure");

  assert.ok(hotp.generate, "generate should be exported");
  assert.ok(hotp.verify, "verify should be exported");

  const counter = 0;

  const token = await hotp.generate({
    secret: TEST_SECRET,
    counter,
    crypto,
    base32,
  });
  assert.ok(token, "Token should be generated");
  assert.strictEqual(typeof token, "string", "Token should be a string");

  const result = await hotp.verify({
    secret: TEST_SECRET,
    counter,
    token,
    crypto,
    base32,
  });
  assert.ok(result.valid, "Generated token should be valid");
});

test("@otplib/uri - can parse and generate otpauth URIs", async () => {
  const uri = await import("@otplib/uri");

  assert.ok(uri.parse, "parse should be exported");
  assert.ok(uri.generate, "generate should be exported");
  assert.ok(uri.generateTOTP, "generateTOTP should be exported");
  assert.ok(uri.generateHOTP, "generateHOTP should be exported");

  const otpauthURI = uri.generateTOTP({
    label: "test@example.com",
    secret: TEST_SECRET,
    issuer: "TestApp",
  });

  assert.ok(
    otpauthURI.startsWith("otpauth://totp/"),
    "URI should start with otpauth://totp/"
  );
  assert.ok(
    otpauthURI.includes(`secret=${TEST_SECRET}`),
    "URI should contain secret"
  );
  assert.ok(otpauthURI.includes("issuer=TestApp"), "URI should contain issuer");

  const parsed = uri.parse(otpauthURI);
  assert.strictEqual(parsed.type, "totp", "Parsed type should be totp");
  assert.strictEqual(
    parsed.params.secret,
    TEST_SECRET,
    "Parsed secret should match"
  );
  assert.strictEqual(
    parsed.params.issuer,
    "TestApp",
    "Parsed issuer should match"
  );
});

test("@otplib/core - can import core utilities", async () => {
  const core = await import("@otplib/core");
  const { crypto } = await import("@otplib/plugin-crypto-node");
  const { base32 } = await import("@otplib/plugin-base32-scure");

  assert.ok(core.generateSecret, "generateSecret should be exported");
  assert.ok(core.validateSecret, "validateSecret should be exported");
  assert.ok(core.normalizeSecret, "normalizeSecret should be exported");

  const secret = core.generateSecret({ crypto, base32 });
  assert.ok(secret, "generateSecret should return a secret");
  assert.strictEqual(typeof secret, "string", "Secret should be a string");
});

test("plugins - can import and use crypto plugins", async () => {
  const noble = await import("@otplib/plugin-crypto-noble");
  const node = await import("@otplib/plugin-crypto-node");

  assert.ok(noble.crypto, "noble plugin should export crypto singleton");
  assert.ok(node.crypto, "node plugin should export crypto singleton");
  assert.ok(
    noble.NobleCryptoPlugin,
    "noble plugin should export NobleCryptoPlugin class"
  );
  assert.ok(
    node.NodeCryptoPlugin,
    "node plugin should export NodeCryptoPlugin class"
  );

  const key = new Uint8Array([1, 2, 3, 4, 5]);
  const data = new Uint8Array([10, 20, 30]);

  const nobleCrypto = noble.crypto;
  const nodeCrypto = node.crypto;

  const nobleHmac = nobleCrypto.hmac("sha1", key, data);
  const nodeHmac = nodeCrypto.hmac("sha1", key, data);

  assert.ok(
    nobleHmac instanceof Uint8Array,
    "noble HMAC should return Uint8Array"
  );
  assert.ok(
    nodeHmac instanceof Uint8Array,
    "node HMAC should return Uint8Array"
  );
  assert.ok(nobleHmac.length > 0, "noble HMAC should have length");
  assert.ok(nodeHmac.length > 0, "node HMAC should have length");
});

test("plugins - can import and use base32 plugin", async () => {
  const base32Pkg = await import("@otplib/plugin-base32-scure");

  assert.ok(base32Pkg.base32, "base32 plugin should export base32 singleton");
  assert.ok(
    base32Pkg.ScureBase32Plugin,
    "base32 plugin should export ScureBase32Plugin class"
  );

  const base32 = base32Pkg.base32;
  const testData = new TextEncoder().encode("hello");

  const encoded = base32.encode(testData);
  assert.ok(encoded, "Should encode data");
  assert.strictEqual(
    typeof encoded,
    "string",
    "Encoded value should be string"
  );

  const decoded = base32.decode(encoded);
  assert.ok(decoded, "Should decode string");
  assert.ok(
    decoded instanceof Uint8Array,
    "Decoded value should be Uint8Array"
  );

  const decodedText = new TextDecoder().decode(decoded);
  assert.strictEqual(
    decodedText,
    "hello",
    "Decoded value should match original"
  );
});

test("TOTP class - can use class-based API", async () => {
  const { TOTP } = await import("@otplib/totp");
  const { crypto } = await import("@otplib/plugin-crypto-node");
  const { base32 } = await import("@otplib/plugin-base32-scure");

  const totp = new TOTP({ secret: TEST_SECRET, crypto, base32 });

  const token = await totp.generate();
  assert.ok(token, "Token should be generated");
  assert.strictEqual(typeof token, "string", "Token should be a string");

  const result = await totp.verify(token);
  assert.ok(result.valid, "Token should be valid");
});

test("HOTP class - can use class-based API", async () => {
  const { HOTP } = await import("@otplib/hotp");
  const { crypto } = await import("@otplib/plugin-crypto-node");
  const { base32 } = await import("@otplib/plugin-base32-scure");

  const hotp = new HOTP({ secret: TEST_SECRET, crypto, base32 });
  const counter = 0;

  const token = await hotp.generate(counter);
  assert.ok(token, "Token should be generated");
  assert.strictEqual(typeof token, "string", "Token should be a string");

  // verify expects { token, counter } object, not two separate args
  const result = await hotp.verify({ token, counter });
  assert.ok(result.valid, "Token should be valid");
});
