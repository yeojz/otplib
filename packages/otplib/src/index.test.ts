/**
 * otplib tests for Node.js/Vitest
 *
 * Uses the shared test suite with NobleCryptoPlugin and ScureBase32Plugin.
 */
import { describe, it, expect } from "vitest";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { TOTP } from "@otplib/totp";
import {
  generateSecret,
  generateURI,
  generate,
  generateSync,
  verify,
  verifySync,
  OTP,
  createGuardrails,
} from "./index.js";
import { createOtplibTests } from "./index-test.ts";

createOtplibTests({
  describe,
  it,
  expect,
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
  otplib: {
    generateSecret,
    generateURI,
    generate,
    generateSync,
    verify,
    verifySync,
    TOTP,
    OTP,
  },
});

describe("guardrails integration", () => {
  const secret = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"; // 20 bytes

  it("should allow custom guardrails in generate", async () => {
    const strictGuardrails = createGuardrails({
      MIN_SECRET_BYTES: 100,
    });

    await expect(generate({ secret, guardrails: strictGuardrails })).rejects.toThrow();
  });

  it("should allow custom guardrails in generateSync", () => {
    const strictGuardrails = createGuardrails({
      MIN_SECRET_BYTES: 100,
    });

    expect(() => generateSync({ secret, guardrails: strictGuardrails })).toThrow();
  });

  it("should allow custom guardrails in verify", async () => {
    const strictGuardrails = createGuardrails({
      MIN_SECRET_BYTES: 100,
    });

    const token = await generate({ secret });

    await expect(verify({ secret, token, guardrails: strictGuardrails })).rejects.toThrow();
  });

  it("should allow custom guardrails in verifySync", () => {
    const strictGuardrails = createGuardrails({
      MIN_SECRET_BYTES: 100,
    });

    const token = generateSync({ secret });

    expect(() => verifySync({ secret, token, guardrails: strictGuardrails })).toThrow();
  });

  it("should work with OTP class", async () => {
    const otp = new OTP();
    const strictGuardrails = createGuardrails({
      MIN_SECRET_BYTES: 100,
    });

    await expect(otp.generate({ secret, guardrails: strictGuardrails })).rejects.toThrow();
  });

  it("should use class guardrails when provided in constructor", async () => {
    const strictGuardrails = createGuardrails({
      MIN_SECRET_BYTES: 100,
    });
    const otp = new OTP({ guardrails: strictGuardrails });

    await expect(otp.generate({ secret })).rejects.toThrow();
  });

  it("should allow per-call guardrails overrides in OTP class", async () => {
    const strictGuardrails = createGuardrails({
      MIN_SECRET_BYTES: 100,
    });
    const lenientGuardrails = createGuardrails({
      MIN_SECRET_BYTES: 1,
    });
    const otp = new OTP({ guardrails: strictGuardrails });

    await expect(otp.generate({ secret, guardrails: lenientGuardrails })).resolves.toBeTypeOf(
      "string",
    );
  });
});
