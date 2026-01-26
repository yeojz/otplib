import { describe, expect, test } from "vitest";
import { deriveKek, wrapDek, unwrapDek } from "../src/crypto/kdf.js";
import { encryptPayload, decryptPayload } from "../src/crypto/aead.js";

describe("KDF and DEK wrapping", () => {
  const fixedSalt = Buffer.alloc(16, 0x01);
  const fixedDek = Buffer.alloc(32, 0x02);
  const fixedNonce = Buffer.alloc(12, 0x03);
  const passphrase = "test-passphrase";

  test("deriveKek returns 32-byte key with params", async () => {
    const { kek, params } = await deriveKek(passphrase, { salt: fixedSalt, N: 16384, r: 8, p: 1 });

    expect(kek).toBeInstanceOf(Buffer);
    expect(kek.length).toBe(32);
    expect(params.salt).toEqual(fixedSalt);
    expect(params.N).toBe(16384);
    expect(params.r).toBe(8);
    expect(params.p).toBe(1);
  });

  test("wrap/unwrap DEK roundtrip", async () => {
    const { kek } = await deriveKek(passphrase, { salt: fixedSalt, N: 16384, r: 8, p: 1 });

    const wrapped = wrapDek(fixedDek, kek, fixedNonce);
    expect(wrapped.nonce).toEqual(fixedNonce);
    expect(wrapped.ciphertext).toBeInstanceOf(Buffer);
    expect(wrapped.tag).toBeInstanceOf(Buffer);
    expect(wrapped.tag.length).toBe(16);

    const unwrapped = unwrapDek(wrapped, kek);
    expect(unwrapped).toEqual(fixedDek);
  });

  test("unwrapDek throws on wrong key", async () => {
    const { kek } = await deriveKek(passphrase, { salt: fixedSalt, N: 16384, r: 8, p: 1 });
    const { kek: wrongKek } = await deriveKek("wrong-passphrase", {
      salt: fixedSalt,
      N: 16384,
      r: 8,
      p: 1,
    });

    const wrapped = wrapDek(fixedDek, kek, fixedNonce);

    expect(() => unwrapDek(wrapped, wrongKek)).toThrow();
  });
});

describe("AEAD payload encryption", () => {
  const fixedKey = Buffer.alloc(32, 0x04);
  const fixedNonce = Buffer.alloc(12, 0x05);

  test("encrypt/decrypt roundtrip for JSON payload", () => {
    const payload = { secret: "JBSWY3DPEHPK3PXP", label: "Test" };

    const encrypted = encryptPayload(payload, fixedKey, fixedNonce);
    expect(encrypted.nonce).toEqual(fixedNonce);
    expect(encrypted.ciphertext).toBeInstanceOf(Buffer);
    expect(encrypted.tag).toBeInstanceOf(Buffer);

    const decrypted = decryptPayload(encrypted, fixedKey);
    expect(decrypted).toEqual(payload);
  });

  test("decryptPayload throws on tampered ciphertext", () => {
    const payload = { secret: "JBSWY3DPEHPK3PXP" };
    const encrypted = encryptPayload(payload, fixedKey, fixedNonce);

    encrypted.ciphertext[0] ^= 0xff;

    expect(() => decryptPayload(encrypted, fixedKey)).toThrow();
  });
});
