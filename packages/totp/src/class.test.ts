import { describe, it, expect } from "vitest";
import { TOTP } from "./class";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { TEST_SECRET_HOTP_BASE32 } from "@repo/testing";

describe("TOTP Class", () => {
  const crypto = new NodeCryptoPlugin();
  const base32 = new ScureBase32Plugin();

  it("should generate a secret", () => {
    const totp = new TOTP({ crypto, base32 });
    const secret = totp.generateSecret();

    expect(secret).toBeTruthy();
    expect(typeof secret).toBe("string");
    expect(secret.length).toBeGreaterThan(0);
  });

  it("should generate a token", async () => {
    const totp = new TOTP({
      secret: TEST_SECRET_HOTP_BASE32,
      crypto,
      base32,
    });

    const token = await totp.generate();

    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.length).toBe(6);
  });

  it("should generate a URI", () => {
    const totp = new TOTP({
      issuer: "MyService",
      label: "user@example.com",
      secret: TEST_SECRET_HOTP_BASE32,
      crypto,
      base32,
    });

    const uri = totp.toURI();

    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain(`secret=${TEST_SECRET_HOTP_BASE32}`);
    expect(uri).toContain("issuer=MyService");
  });

  it("should allow options override in generate", async () => {
    const totp = new TOTP({
      secret: TEST_SECRET_HOTP_BASE32,
      algorithm: "sha1",
      digits: 6,
      crypto,
      base32,
    });

    const token = await totp.generate({ digits: 8 });

    expect(token.length).toBe(8);
  });

  it("should allow options override in verify", async () => {
    const totp = new TOTP({
      secret: TEST_SECRET_HOTP_BASE32,
      crypto,
      base32,
    });

    const token = await totp.generate();
    const result = await totp.verify(token, { epochTolerance: 30 });

    expect(result.valid).toBe(true);
  });

  it("should support Uint8Array secret without Base32 plugin", async () => {
    const secret = new Uint8Array(20).fill(1);
    const epoch = 1234567890;
    const totp = new TOTP({ secret, crypto });

    const token = await totp.generate({ epoch });
    const result = await totp.verify(token, { epoch });

    expect(token).toMatch(/^\d{6}$/);
    expect(result.valid).toBe(true);
  });

  it("should create instance with no options (testing default parameter)", () => {
    const totp = new TOTP();
    expect(totp).toBeInstanceOf(TOTP);
  });

  it("should create instance with empty options (testing default parameter)", () => {
    const totp = new TOTP({});
    expect(totp).toBeInstanceOf(TOTP);
  });

  it("should return full result when format is 'full'", async () => {
    const epoch = 1234567890;
    const totp = new TOTP({
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    const result = await totp.generate({ epoch, format: "full" });

    expect(result).toHaveProperty("token");
    expect(result).toHaveProperty("timeStep");
    expect(result).toHaveProperty("epoch");
    expect(typeof result.token).toBe("string");
    expect(result.token.length).toBe(6);
    expect(result.epoch).toBe(result.timeStep * 30 + 0);
  });

  it("should return string when format is not specified (backward compat)", async () => {
    const totp = new TOTP({
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    const result = await totp.generate();

    expect(typeof result).toBe("string");
    expect(result.length).toBe(6);
  });

  it("should allow options override with partial options in generate", async () => {
    const totp = new TOTP({
      secret: TEST_SECRET_HOTP_BASE32,
      algorithm: "sha1",
      crypto,
      base32,
    });

    // Should use instance's secret and crypto, override digits
    const token = await totp.generate({ digits: 8 });
    expect(token.length).toBe(8);
  });

  it("should return string from no-arg generate regardless of instance config", async () => {
    // format is not a constructor option, so no-arg generate always returns string
    const totp = new TOTP({
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    const result = await totp.generate();
    expect(typeof result).toBe("string");
    expect(result.length).toBe(6);
  });

  it("should only return detailed result when format is passed at call site", async () => {
    const epoch = 1234567890;
    const totp = new TOTP({
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    // No-arg call returns string
    const stringResult = await totp.generate({ epoch });
    expect(typeof stringResult).toBe("string");

    // format: "full" at call site returns detailed result
    const detailedResult = await totp.generate({ epoch, format: "full" });
    expect(typeof detailedResult).toBe("object");
    expect(detailedResult).toHaveProperty("token");
    expect(detailedResult).toHaveProperty("timeStep");
    expect(detailedResult).toHaveProperty("epoch");
  });

  it("should return boolean when verify format is 'plain'", async () => {
    const totp = new TOTP({
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    const epoch = 1234567890;
    const token = await totp.generate({ epoch });
    const result = await totp.verify(token, { epoch, format: "plain" });

    expect(result).toBe(true);
  });

  it("should return false when verify format is 'plain' and token is invalid", async () => {
    const totp = new TOTP({
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    const result = await totp.verify("000000", { epoch: 1234567890, format: "plain" });

    expect(result).toBe(false);
  });

  it("should return VerifyResult when verify format is 'full'", async () => {
    const totp = new TOTP({
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    const epoch = 1234567890;
    const token = await totp.generate({ epoch });
    const result = await totp.verify(token, { epoch, format: "full" });

    expect(result).toEqual({
      valid: true,
      delta: 0,
      epoch: expect.any(Number),
      timeStep: expect.any(Number),
    });
  });

  it("should return VerifyResult when verify format is omitted (default)", async () => {
    const totp = new TOTP({
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    const epoch = 1234567890;
    const token = await totp.generate({ epoch });
    const result = await totp.verify(token, { epoch });

    expect(result).toHaveProperty("valid", true);
    expect(result).toHaveProperty("delta");
  });
});
