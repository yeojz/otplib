/**
 * Distribution tests for Bun runtime
 *
 * Tests the built artifacts using Noble crypto plugin (Bun-compatible).
 */

import { describe, it, expect } from "bun:test";
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
} from "otplib";

import { createHOTPDistributionTests } from "./hotp-test.js";
import { createTOTPDistributionTests } from "./totp-test.js";
import { createOtplibDistributionTests } from "./otplib-test.js";

const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();

// Run HOTP distribution tests
createHOTPDistributionTests({
  describe,
  it,
  expect,
  crypto,
});

// Run TOTP distribution tests
createTOTPDistributionTests({
  describe,
  it,
  expect,
  crypto,
});

// Run otplib distribution tests
createOtplibDistributionTests({
  describe,
  it,
  expect,
  crypto,
  base32,
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
