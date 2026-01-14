import { describe, it, expect } from "vitest";
import { HOTP } from "./class.js";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

describe("HOTP Class", () => {
  const crypto = new NodeCryptoPlugin();
  const base32 = new ScureBase32Plugin();

  it("should generate a secret", () => {
    const hotp = new HOTP({ crypto, base32 });
    const secret = hotp.generateSecret();

    expect(secret).toBeTruthy();
    expect(typeof secret).toBe("string");
    expect(secret.length).toBeGreaterThan(0);
  });

  it("should generate a token at counter", async () => {
    const hotp = new HOTP({
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    const token = await hotp.generate(0);

    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.length).toBe(6);
  });

  it("should generate a URI", () => {
    const hotp = new HOTP({
      issuer: "MyService",
      label: "user@example.com",
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    const uri = hotp.toURI(5);

    expect(uri).toContain("otpauth://hotp/");
    expect(uri).toContain("secret=GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337");
    expect(uri).toContain("issuer=MyService");
    expect(uri).toContain("counter=5");
  });

  it("should allow options override in verify", async () => {
    const hotp = new HOTP({
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    const token = await hotp.generate(5);
    const result = await hotp.verify({ token, counter: 5 }, { counterTolerance: 5 });

    expect(result.valid).toBe(true);
  });

  it("should create instance with no options (testing default parameter)", () => {
    const hotp = new HOTP();
    expect(hotp).toBeInstanceOf(HOTP);
  });

  it("should create instance with empty options (testing default parameter)", () => {
    const hotp = new HOTP({});
    expect(hotp).toBeInstanceOf(HOTP);
  });

  it("should generate URI with default counter parameter (0)", () => {
    const hotp = new HOTP({
      issuer: "MyService",
      label: "user@example.com",
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    const uri = hotp.toURI();

    expect(uri).toContain("otpauth://hotp/");
    expect(uri).toContain("secret=GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337");
    expect(uri).toContain("issuer=MyService");
    expect(uri).toContain("counter=0");
  });

  it("should generate URI without counter argument", () => {
    const hotp = new HOTP({
      issuer: "MyService",
      label: "user@example.com",
      secret: "GHDHB5FUNZ2Z4OT7PB2BUPHBIDR2J337",
      crypto,
      base32,
    });

    // Call toURI without arguments to test default parameter
    const uri = hotp.toURI();
    expect(uri).toContain("counter=0");
  });
});
