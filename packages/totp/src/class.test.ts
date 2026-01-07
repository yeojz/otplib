import { describe, it, expect } from "vitest";
import { TOTP } from "./class";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

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
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
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
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    const uri = totp.toURI();

    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("secret=GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337");
    expect(uri).toContain("issuer=MyService");
  });

  it("should allow options override in generate", async () => {
    const totp = new TOTP({
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
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
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    const token = await totp.generate();
    const result = await totp.verify(token, { epochTolerance: 30 });

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

  it("should allow options override with partial options in generate", async () => {
    const totp = new TOTP({
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      algorithm: "sha1",
      crypto,
      base32,
    });

    // Should use instance's secret and crypto, override digits
    const token = await totp.generate({ digits: 8 });
    expect(token.length).toBe(8);
  });
});
