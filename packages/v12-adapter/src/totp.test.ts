import { describe, it, expect } from "vitest";
import { createGuardrails } from "@otplib/core";
import { TOTP, HashAlgorithms, type TOTPOptions } from "./index";
import { RFC6238_VECTORS, BASE_SECRET, BASE_SECRET_BASE32 } from "@repo/testing";

describe("TOTP (v12-adapter)", () => {
  describe("constructor and options", () => {
    it("should create instance with default options", () => {
      // ...

      const totp = new TOTP();
      const opts = totp.allOptions();

      expect(opts.algorithm).toBe(HashAlgorithms.SHA1);
      expect(opts.digits).toBe(6);
      expect(opts.step).toBe(30);
      expect(opts.window).toBe(0);
    });

    it("should accept default options in constructor", () => {
      const totp = new TOTP({ step: 60 });
      const opts = totp.allOptions();

      expect(opts.step).toBe(60);
    });

    it("should create new instance", () => {
      const totp = new TOTP();
      const created = totp.create({ step: 60 });

      expect(created).toBeInstanceOf(TOTP);
      expect(created.allOptions().step).toBe(60);
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

      // v12 uses epoch in milliseconds
      totp.options = { epoch: 0 };
      const token1 = totp.generate(secret);

      // 30 seconds later (30000 ms)
      totp.options = { epoch: 30000 };
      const token2 = totp.generate(secret);

      expect(token1).not.toBe(token2);
    });

    it("should support custom step", () => {
      const totp = new TOTP<TOTPOptions>({ step: 60 });
      const secret = BASE_SECRET;

      // v12 uses epoch in milliseconds
      totp.options = { epoch: 0 };
      const token1 = totp.generate(secret);

      // 30 seconds later - still within 60-second window
      totp.options = { epoch: 30000 };
      const token2 = totp.generate(secret);

      // Same token within 60-second window
      expect(token1).toBe(token2);
    });

    it("should apply guardrails from constructor", () => {
      const strictGuardrails = createGuardrails({ MIN_SECRET_BYTES: 100 });
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
        totp.options = { epoch: epoch * 1000 };
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
        totp.options = { epoch: epoch * 1000 };
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
        totp.options = { epoch: epoch * 1000 };
        expect(totp.generate(secret)).toBe(expected);
      });
    });
  });

  describe("check", () => {
    it("should return true for valid token", () => {
      const totp = new TOTP({ epoch: 0 });
      const secret = BASE_SECRET;
      const token = totp.generate(secret);

      expect(totp.check(token, secret)).toBe(true);
    });

    it("should return false for invalid token", () => {
      const totp = new TOTP({ epoch: 0 });
      const secret = BASE_SECRET;

      expect(totp.check("000000", secret)).toBe(false);
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

      // Check from next window (epoch 30000 ms = step 1) with window of 1
      const totp2 = new TOTP({ epoch: 30000, window: 1 });
      const delta = totp2.checkDelta(pastToken, secret);

      expect(delta).toBe(-1);
    });

    it("should support array-based window [past, future] for asymmetric tolerance", () => {
      const secret = BASE_SECRET;

      // Generate token for time step 0 (epoch 0)
      const totp1 = new TOTP({ epoch: 0 });
      const pastToken = totp1.generate(secret);

      // Check from step 2 (epoch 60000ms) with asymmetric window [2, 0]
      // This allows 2 steps in the past but 0 steps in the future
      const totp2 = new TOTP<TOTPOptions>({ epoch: 60000, window: [2, 0] });
      const delta = totp2.checkDelta(pastToken, secret);

      // Token from step 0, checking from step 2, delta should be -2
      expect(delta).toBe(-2);
    });

    it("should return null when crypto plugin throws an error", () => {
      const throwingCrypto = {
        createHmac: () => {
          throw new Error("Simulated crypto failure");
        },
      };

      const totp = new TOTP<TOTPOptions>({
        epoch: 0,
        crypto: throwingCrypto as unknown as TOTPOptions["crypto"],
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
      // epoch 15000ms = 15 seconds into step
      const totp = new TOTP({ epoch: 15000, step: 30 });
      expect(totp.timeUsed()).toBe(15);
    });

    it("should calculate time remaining", () => {
      // epoch 15000ms = 15 seconds into step, 15 remaining
      const totp = new TOTP({ epoch: 15000, step: 30 });
      expect(totp.timeRemaining()).toBe(15);
    });
  });
});
