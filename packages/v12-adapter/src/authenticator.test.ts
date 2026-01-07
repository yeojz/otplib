/**
 * @otplib/v12-adapter
 *
 * Authenticator class tests - verifying v12 API compatibility
 */

import { describe, it, expect } from "vitest";
import { Authenticator, authenticator, HashAlgorithms } from "./index";
import type { AuthenticatorOptions } from "./types";

describe("Authenticator (v12-adapter)", () => {
  describe("constructor and options", () => {
    it("should create instance with default options", () => {
      const auth = new Authenticator();
      const opts = auth.allOptions();

      expect(opts.algorithm).toBe(HashAlgorithms.SHA1);
      expect(opts.digits).toBe(6);
      expect(opts.step).toBe(30);
    });

    it("should accept default options in constructor", () => {
      const auth = new Authenticator({ step: 60 });
      const opts = auth.allOptions();

      expect(opts.step).toBe(60);
    });

    it("should create new instance", () => {
      const auth = new Authenticator();
      const created = auth.create({ step: 60 });

      expect(created).toBeInstanceOf(Authenticator);
      expect(created.allOptions().step).toBe(60);
    });
  });

  describe("generateSecret", () => {
    it("should generate Base32 secret with default length", () => {
      const auth = new Authenticator();
      const secret = auth.generateSecret();

      expect(secret).toBeDefined();
      expect(typeof secret).toBe("string");
      // Base32 characters only
      expect(secret).toMatch(/^[A-Z2-7]+$/);
    });

    it("should generate secret with specified length", () => {
      const auth = new Authenticator();
      const secret10 = auth.generateSecret(10);
      const secret32 = auth.generateSecret(32);

      // Longer byte input = longer Base32 output
      expect(secret32.length).toBeGreaterThan(secret10.length);
    });
  });

  describe("generate", () => {
    it("should generate token from Base32 secret", () => {
      const auth = new Authenticator({ epoch: 0 });
      const secret = auth.generateSecret();
      const token = auth.generate(secret);

      expect(token).toHaveLength(6);
      expect(token).toMatch(/^\d{6}$/);
    });
  });

  describe("check", () => {
    it("should return true for valid token", () => {
      const auth = new Authenticator({ epoch: 0 });
      const secret = auth.generateSecret();
      const token = auth.generate(secret);

      expect(auth.check(token, secret)).toBe(true);
    });

    it("should return false for invalid token", () => {
      const auth = new Authenticator({ epoch: 0 });
      const secret = auth.generateSecret();

      expect(auth.check("000000", secret)).toBe(false);
    });
  });

  describe("checkDelta", () => {
    it("should return 0 for current window token", () => {
      const auth = new Authenticator({ epoch: 0 });
      const secret = auth.generateSecret();
      const token = auth.generate(secret);

      expect(auth.checkDelta(token, secret)).toBe(0);
    });

    it("should return null for invalid token", () => {
      const auth = new Authenticator({ epoch: 0 });
      const secret = auth.generateSecret();

      expect(auth.checkDelta("000000", secret)).toBe(null);
    });
  });

  describe("verify", () => {
    it("should verify with object-based API", () => {
      const auth = new Authenticator({ epoch: 0 });
      const secret = auth.generateSecret();
      const token = auth.generate(secret);

      expect(auth.verify({ token, secret })).toBe(true);
    });

    it("should throw for non-object argument", () => {
      const auth = new Authenticator();

      expect(() => {
        // @ts-expect-error - Testing invalid argument
        auth.verify("invalid");
      }).toThrow("Expecting argument 0 of verify to be an object");
    });
  });

  describe("encode and decode", () => {
    it("should encode secret to Base32", () => {
      const auth = new Authenticator();
      const rawSecret = "test-secret";
      const encoded = auth.encode(rawSecret);

      expect(encoded).toBeDefined();
      expect(typeof encoded).toBe("string");
      expect(encoded).toMatch(/^[A-Z2-7]+$/);
    });

    it("should decode Base32 secret", () => {
      const auth = new Authenticator();
      const rawSecret = "test-secret";
      const encoded = auth.encode(rawSecret);
      const decoded = auth.decode(encoded);

      expect(decoded).toBe(rawSecret);
    });
  });

  describe("keyuri", () => {
    it("should generate valid otpauth URI", () => {
      const auth = new Authenticator();
      const secret = auth.generateSecret();
      const uri = auth.keyuri("user@example.com", "MyApp", secret);

      expect(uri).toContain("otpauth://totp/");
      expect(uri).toContain("user%40example.com");
      expect(uri).toContain("issuer=MyApp");
      expect(uri).toContain(`secret=${secret}`);
    });
  });

  describe("pre-configured instance", () => {
    it("should export pre-configured authenticator", () => {
      expect(authenticator).toBeInstanceOf(Authenticator);

      const secret = authenticator.generateSecret();
      expect(secret).toBeDefined();
    });

    it("should generate and verify tokens", () => {
      const auth = new Authenticator({ epoch: 0 });
      const secret = auth.generateSecret();
      const token = auth.generate(secret);

      expect(auth.check(token, secret)).toBe(true);
    });
  });
  describe("authenticator checkDelta with window", () => {
    // strict epoch check heuristic in Authenticator requires > 1e12 for ms
    const now = 1600000000000; // 2020-09-13...

    it("should support array window [past, future]", () => {
      const auth = new Authenticator<AuthenticatorOptions>({ epoch: now, step: 30 });
      const secret = auth.generateSecret();

      // Token from 2 steps ago (60s)
      const pastAuth = new Authenticator<AuthenticatorOptions>({ epoch: now - 60000, step: 30 });
      const pastToken = pastAuth.generate(secret);

      // Window allowing 2 steps back
      auth.options = { window: [2, 0] };

      expect(auth.checkDelta(pastToken, secret)).toBe(-2);
      expect(auth.check(pastToken, secret)).toBe(true);
    });

    it("should reject outside array window", () => {
      const auth = new Authenticator<AuthenticatorOptions>({ epoch: now, step: 30 });
      const secret = auth.generateSecret();

      // Token from 2 steps ago
      const pastAuth = new Authenticator<AuthenticatorOptions>({ epoch: now - 60000, step: 30 });
      const pastToken = pastAuth.generate(secret);

      // Window allowing only 1 step back
      auth.options = { window: [1, 0] };

      expect(auth.checkDelta(pastToken, secret)).toBe(null);
      expect(auth.check(pastToken, secret)).toBe(false);
    });
    it("should ignore invalid window type", () => {
      const auth = new Authenticator();
      const secret = auth.generateSecret();
      const token = auth.generate(secret);

      auth.options = { window: {} as unknown as number };

      // Should default to 0 tolerance, so current token works
      expect(auth.checkDelta(token, secret)).toBe(0);
    });
  });

  describe("error handling", () => {
    it("should return null in checkDelta when crypto throws", () => {
      const throwingCrypto = {
        name: "throwing-plugin",
        randomBytes: () => new Uint8Array(10),
        hmac: () => {
          throw new Error("Crypto error");
        },
      };

      const auth = new Authenticator({
        crypto: throwingCrypto as unknown as AuthenticatorOptions["crypto"],
      });

      const secret = auth.generateSecret();
      expect(auth.checkDelta("123456", secret)).toBe(null);
    });
  });

  describe("encoder/decoder fallbacks", () => {
    it("should fallback to default encoder when keyEncoder is explicitly undefined", () => {
      const auth = new Authenticator();
      // Explicitly remove the keyEncoder from options to trigger fallback
      auth.options = { keyEncoder: undefined };

      const secret = "test";
      // This should use the default encoder since the option is undefined
      // and the method has a fallback
      expect(auth.encode(secret)).toBeDefined();
    });

    it("should fallback to default decoder when keyDecoder is explicitly undefined", () => {
      const auth = new Authenticator();
      // Explicitly remove the keyDecoder from options to trigger fallback
      auth.options = { keyDecoder: undefined };

      // Generate a valid base32 string (default encoder)
      const encoded = auth.encode("test");

      // This should use the default decoder since the option is undefined
      expect(auth.decode(encoded)).toBe("test");
    });
  });
});
