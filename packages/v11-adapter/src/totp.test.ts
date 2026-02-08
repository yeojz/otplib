import { describe, it, expect } from "vitest";
import { CryptoPlugin, createGuardrails } from "@otplib/core";
import { TOTP, HashAlgorithms, type TOTPOptions } from "./index.js";
import { RFC6238_VECTORS, BASE_SECRET, BASE_SECRET_BASE32 } from "@repo/testing";

describe("TOTP (v11-adapter)", () => {
  describe("constructor and options", () => {
    it("should create new instance", () => {
      const totp = new TOTP();
      const created = totp.create({ step: 60 });

      expect(created).toBeInstanceOf(TOTP);
      expect(created.allOptions().step).toBe(60);

      const createdDefault = totp.create();
      expect(createdDefault).toBeInstanceOf(TOTP);
      expect(createdDefault.allOptions().step).toBe(30);
    });
    it("should create instance with default options", () => {
      const totp = new TOTP();
      const opts = totp.allOptions();

      expect(opts.algorithm).toBe(HashAlgorithms.SHA1);
      expect(opts.digits).toBe(6);
      expect(opts.step).toBe(30);
      expect(opts.window).toBe(0);
      // epoch defaults to current time (seconds)
      expect(opts.epoch).toBeGreaterThan(0);
    });

    it("should accept default options in constructor", () => {
      const totp = new TOTP({ step: 60 });
      const opts = totp.allOptions();

      expect(opts.step).toBe(60);
    });
  });

  describe("generate", () => {
    it("should generate 6-digit token by default", () => {
      const totp = new TOTP();
      const secret = BASE_SECRET;
      const token = totp.generate(secret);

      expect(token).toHaveLength(6);
      expect(token).toMatch(/^\d{6}$/);
    });

    it("should generate different tokens at different times", () => {
      const totp = new TOTP();
      const secret = BASE_SECRET;

      // v11 uses epoch in seconds
      totp.options = { epoch: 0 };
      const token1 = totp.generate(secret);

      // 30 seconds later
      totp.options = { epoch: 30 };
      const token2 = totp.generate(secret);

      expect(token1).not.toBe(token2);
    });

    it("should support custom step", () => {
      const totp = new TOTP<TOTPOptions>({ step: 60 });
      const secret = BASE_SECRET;

      totp.options = { epoch: 0 };
      const token1 = totp.generate(secret);

      // 30 seconds later - still within 60-second window
      totp.options = { epoch: 30 };
      const token2 = totp.generate(secret);

      // Same token within 60-second window
      expect(token1).toBe(token2);
    });

    it("should apply guardrails from constructor", () => {
      const strictGuardrails = createGuardrails({ MIN_SECRET_BYTES: 100, MAX_SECRET_BYTES: 200 });
      const totp = new TOTP({ guardrails: strictGuardrails });

      expect(() => totp.generate(BASE_SECRET)).toThrow();
    });
  });

  describe("RFC6238 - specific vectors", () => {
    it("should match RFC 6238 SHA1 vectors", () => {
      const { secret, vectors } = RFC6238_VECTORS.sha1;
      const totp = new TOTP<TOTPOptions>({
        algorithm: HashAlgorithms.SHA1,
        step: 30,
        digits: 8,
      });

      vectors.forEach(({ epoch, expected }) => {
        // v11 uses seconds, so use epoch directly
        totp.options = { epoch };
        expect(totp.generate(secret)).toBe(expected);
      });
    });

    it("should match RFC 6238 SHA256 vectors", () => {
      const { secret, vectors } = RFC6238_VECTORS.sha256;
      const totp = new TOTP<TOTPOptions>({
        algorithm: HashAlgorithms.SHA256,
        step: 30,
        digits: 8,
      });

      vectors.forEach(({ epoch, expected }) => {
        totp.options = { epoch };
        expect(totp.generate(secret)).toBe(expected);
      });
    });

    it("should match RFC 6238 SHA512 vectors", () => {
      const { secret, vectors } = RFC6238_VECTORS.sha512;
      const totp = new TOTP<TOTPOptions>({
        algorithm: HashAlgorithms.SHA512,
        step: 30,
        digits: 8,
      });

      vectors.forEach(({ epoch, expected }) => {
        totp.options = { epoch };
        expect(totp.generate(secret)).toBe(expected);
      });
    });
  });

  describe("checkDelta", () => {
    it("should return 0 for current window token", () => {
      const totp = new TOTP({ epoch: 0 });
      const secret = BASE_SECRET;
      const token = totp.generate(secret);

      expect(totp.checkDelta(token, secret)).toBe(0);
    });

    it("should return null for invalid token", () => {
      const totp = new TOTP({ epoch: 0 });
      const secret = BASE_SECRET;

      expect(totp.checkDelta("000000", secret)).toBe(null);
    });

    it("should return delta for token in window", () => {
      const secret = BASE_SECRET;

      // Generate token for time step 0 (epoch 0)
      const totp1 = new TOTP({ epoch: 0 });
      const pastToken = totp1.generate(secret);

      // Check from next window (epoch 30 sec = step 1) with window of 1
      const totp2 = new TOTP({ epoch: 30, window: 1 });
      const delta = totp2.checkDelta(pastToken, secret);

      expect(delta).toBe(-1);
    });

    it("should support array-based window [past, future]", () => {
      const secret = BASE_SECRET;

      const totp1 = new TOTP({ epoch: 0 });
      const pastToken = totp1.generate(secret);

      // Check from step 2 (epoch 60 sec) with window [2, 0]
      const totp2 = new TOTP<TOTPOptions>({ epoch: 60, window: [2, 0] });
      const delta = totp2.checkDelta(pastToken, secret);

      expect(delta).toBe(-2);
    });

    it("should return null when crypto plugin throws an error", () => {
      const throwingCrypto = {
        hmac: () => {
          throw new Error("Simulated crypto failure");
        },
      };

      const totp = new TOTP<TOTPOptions>({
        epoch: 0,
        crypto: throwingCrypto as unknown as CryptoPlugin,
      });

      // Should catch the error and return null instead of throwing
      expect(totp.checkDelta("123456", BASE_SECRET)).toBe(null);
    });
  });

  describe("verify", () => {
    it("should verify with object-based API", () => {
      const totp = new TOTP({ epoch: 0 });
      const secret = BASE_SECRET;
      const token = totp.generate(secret);

      expect(totp.verify({ token, secret })).toBe(true);
    });

    it("should throw for non-object argument", () => {
      const totp = new TOTP();

      expect(() => {
        // @ts-expect-error - Testing invalid argument
        totp.verify("invalid");
      }).toThrow("Expecting argument 0 of verify to be an object");
    });
  });

  describe("keyuri", () => {
    it("should generate valid otpauth URI", () => {
      const totp = new TOTP();
      const uri = totp.keyuri("user@example.com", "MyApp", BASE_SECRET_BASE32);

      expect(uri).toContain("otpauth://totp/");
      expect(uri).toContain("user%40example.com");
      expect(uri).toContain("issuer=MyApp");
      expect(uri).toContain(`secret=${BASE_SECRET_BASE32}`);
    });
  });

  describe("timeUsed and timeRemaining", () => {
    it("should calculate time used in current step", () => {
      // epoch 15s = 15 seconds into step
      const totp = new TOTP({ epoch: 15, step: 30 });
      expect(totp.timeUsed()).toBe(15);
    });

    it("should calculate time remaining", () => {
      // epoch 15s = 15 seconds into step
      const totp = new TOTP({ epoch: 15, step: 30 });
      expect(totp.timeRemaining()).toBe(15);
    });
  });
});
