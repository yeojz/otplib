/**
 * Distribution tests for Node.js (Vitest)
 *
 * Tests the built artifacts using Node.js crypto plugin.
 */

import { describe, it, expect } from "vitest";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
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
import { createURIDistributionTests } from "./uri-test.js";

const crypto = new NodeCryptoPlugin();
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
