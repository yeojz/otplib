import { describe, it, expect } from "vitest";
import { HOTP } from "./class.js";
import { createGuardrails } from "@otplib/core";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { TEST_SECRET_HOTP_BASE32 } from "@repo/testing";

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
      secret: TEST_SECRET_HOTP_BASE32,
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
      secret: TEST_SECRET_HOTP_BASE32,
      crypto,
      base32,
    });

    const uri = hotp.toURI(5);

    expect(uri).toContain("otpauth://hotp/");
    expect(uri).toContain(`secret=${TEST_SECRET_HOTP_BASE32}`);
    expect(uri).toContain("issuer=MyService");
    expect(uri).toContain("counter=5");
  });

  it("should allow options override in verify", async () => {
    const hotp = new HOTP({
      secret: TEST_SECRET_HOTP_BASE32,
      crypto,
      base32,
    });

    const token = await hotp.generate(5);
    const result = await hotp.verify({ token, counter: 5 }, { counterTolerance: 5 });

    expect(result.valid).toBe(true);
  });

  it("should support Uint8Array secret without Base32 plugin", async () => {
    const secret = new Uint8Array(20).fill(1);
    const hotp = new HOTP({ secret, crypto });

    const token = await hotp.generate(0);
    const result = await hotp.verify({ token, counter: 0 });

    expect(token).toMatch(/^\d{6}$/);
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
      secret: TEST_SECRET_HOTP_BASE32,
      crypto,
      base32,
    });

    const uri = hotp.toURI();

    expect(uri).toContain("otpauth://hotp/");
    expect(uri).toContain(`secret=${TEST_SECRET_HOTP_BASE32}`);
    expect(uri).toContain("issuer=MyService");
    expect(uri).toContain("counter=0");
  });

  it("should generate URI without counter argument", () => {
    const hotp = new HOTP({
      issuer: "MyService",
      label: "user@example.com",
      secret: TEST_SECRET_HOTP_BASE32,
      crypto,
      base32,
    });

    // Call toURI without arguments to test default parameter
    const uri = hotp.toURI();
    expect(uri).toContain("counter=0");
  });

  describe("per-call guardrails override", () => {
    // The instance is created with default guardrails. Passing `guardrails` per call
    // must take precedence over the instance guardrails (`options?.guardrails ?? this.guardrails`).
    const strict = createGuardrails({ MIN_SECRET_BYTES: 1, MAX_SECRET_BYTES: 1 });

    it("should apply a per-call guardrails override in generate", async () => {
      const hotp = new HOTP({ secret: TEST_SECRET_HOTP_BASE32, crypto, base32 });

      // Without override: instance (default) guardrails accept the secret.
      await expect(hotp.generate(0)).resolves.toBeTruthy();
      // With override: the stricter per-call guardrails reject the (longer) secret.
      await expect(hotp.generate(0, { guardrails: strict })).rejects.toThrow();
    });

    it("should apply a per-call guardrails override in verify", async () => {
      const hotp = new HOTP({ secret: TEST_SECRET_HOTP_BASE32, crypto, base32 });
      const token = await hotp.generate(0);

      await expect(hotp.verify({ token, counter: 0 })).resolves.toMatchObject({ valid: true });
      await expect(hotp.verify({ token, counter: 0 }, { guardrails: strict })).rejects.toThrow();
    });
  });
});
