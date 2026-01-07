/**
 * otplib tests for Bun runtime
 *
 * Uses the shared test suite with NobleCryptoPlugin and ScureBase32Plugin.
 * Run with: bun test packages/otplib/src/index.bun.test.ts
 *
 * Note: Uses dist files due to workspace package resolution issues in Bun.
 */
import { describe, it, expect } from "bun:test";
import { NobleCryptoPlugin } from "../../plugin-crypto-noble/dist/index.js";
import { ScureBase32Plugin } from "../../plugin-base32-scure/dist/index.js";
import {
  generateSecret,
  generateURI,
  generate,
  generateSync,
  verify,
  verifySync,
  OTP,
} from "../dist/index.js";
import { TOTP } from "@otplib/totp";
import { createOtplibTests } from "./index-test.js";

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
