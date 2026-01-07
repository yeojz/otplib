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
} from "./index";
import { createOtplibTests } from "./index-test";

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
