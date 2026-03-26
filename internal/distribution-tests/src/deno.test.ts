/**
 * Distribution tests for Deno runtime
 *
 * Tests the built artifacts using Noble crypto plugin (Deno-compatible).
 */

import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
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

import { createHOTPDistributionTests } from "./hotp-test.ts";
import { createTOTPDistributionTests } from "./totp-test.ts";
import { createOtplibDistributionTests } from "./otplib-test.ts";
import { createURIDistributionTests } from "./uri-test.ts";

const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();

// Run URI distribution tests
createURIDistributionTests({
  describe,
  it,
  expect,
});

// Run HOTP distribution tests
createHOTPDistributionTests({
  describe,
  it,
  expect,
  crypto,
  base32,
});

// Run TOTP distribution tests
createTOTPDistributionTests({
  describe,
  it,
  expect,
  crypto,
  base32,
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
