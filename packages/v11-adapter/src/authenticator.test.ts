import { describe, it, expect } from "vitest";
import { Authenticator } from "./index";
import { BASE_SECRET_BASE32 } from "@repo/testing";
import { CryptoPlugin } from "@otplib/core";

describe("Authenticator (v11-adapter)", () => {
  it("should generate token from base32 secret", () => {
    const auth = new Authenticator({ epoch: 0 });
    const secret = BASE_SECRET_BASE32 + BASE_SECRET_BASE32; // Ensure > 16 bytes
    const token = auth.generate(secret);

    expect(token).toHaveLength(6);
    expect(auth.check(token, secret)).toBe(true);
  });

  it("should generate secret in base32", () => {
    const auth = new Authenticator();
    const secret = auth.generateSecret();

    expect(secret).toMatch(/^[A-Z2-7]+=*$/);
  });

  it("should encode/decode secrets", () => {
    const auth = new Authenticator();
    const raw = "hello";
    const encoded = auth.encode(raw);
    const decoded = auth.decode(encoded);

    expect(encoded).not.toBe(raw);
    expect(decoded).toBe(raw);
  });

  it("should use custom key encoder/decoder", () => {
    const auth = new Authenticator();
    const customEncoder = (s: string) => `encoded:${s}`;
    const customDecoder = (s: string) => s.replace("encoded:", "");

    auth.options = {
      keyEncoder: customEncoder,
      keyDecoder: customDecoder,
    };

    expect(auth.encode("test")).toBe("encoded:test");
    expect(auth.decode("encoded:test")).toBe("test");
  });

  it("should verify with object argument", () => {
    const auth = new Authenticator({ epoch: 0 });
    const secret = BASE_SECRET_BASE32 + BASE_SECRET_BASE32;
    const token = auth.generate(secret);

    expect(auth.verify({ token, secret })).toBe(true);
  });

  it("should verify throw on invalid argument", () => {
    const auth = new Authenticator();
    // @ts-expect-error - testing runtime check
    expect(() => auth.verify("invalid")).toThrow("Expecting argument 0");
  });

  it("should checkDelta with array window", () => {
    const auth = new Authenticator({ epoch: 60, window: [2, 0] });
    const secret = BASE_SECRET_BASE32 + BASE_SECRET_BASE32;

    // Generate at epoch 0
    const auth0 = new Authenticator({ epoch: 0 });
    const token = auth0.generate(secret);

    // Check at epoch 60 (step 2) with window [2, 0]
    expect(auth.checkDelta(token, secret)).toBe(-2);
  });

  it("should return null for invalid token in checkDelta", () => {
    const auth = new Authenticator();
    const secret = BASE_SECRET_BASE32 + BASE_SECRET_BASE32;
    expect(auth.checkDelta("000000", secret)).toBe(null);
  });

  it("should return null on checkDelta error", () => {
    const auth = new Authenticator({
      crypto: {
        hmac: () => {
          throw new Error("fail");
        },
      } as unknown as CryptoPlugin,
    });

    expect(auth.checkDelta("123", BASE_SECRET_BASE32)).toBe(null);
  });

  it("should create new instance", () => {
    const auth = new Authenticator();
    const instance = auth.create();
    expect(instance).toBeInstanceOf(Authenticator);
  });

  it("should support number window", () => {
    // window = 1 step
    const auth = new Authenticator({ epoch: 30, window: 1 });
    const secret = BASE_SECRET_BASE32 + BASE_SECRET_BASE32;

    const auth0 = new Authenticator({ epoch: 0 });
    const token = auth0.generate(secret);

    expect(auth.checkDelta(token, secret)).toBe(-1);
  });
});
