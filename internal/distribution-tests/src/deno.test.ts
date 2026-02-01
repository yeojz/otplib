/**
 * Distribution tests for Deno runtime
 *
 * Tests the built artifacts using Noble crypto plugin (Deno-compatible).
 */

import {
  assertEquals,
  assertNotEquals,
  assertMatch,
  assertThrows,
  assertInstanceOf,
} from "@std/assert";
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
import { createDenoTestContext } from "@repo/testing";

import { createHOTPDistributionTests } from "./hotp-test.ts";
import { createTOTPDistributionTests } from "./totp-test.ts";
import { createOtplibDistributionTests } from "./otplib-test.ts";
import { createURIDistributionTests } from "./uri-test.ts";

const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();

// Create Deno test context for URI
const uriCtx = createDenoTestContext(
  { assertEquals, assertNotEquals, assertMatch, assertThrows, assertInstanceOf },
  {},
);

createURIDistributionTests(uriCtx);
uriCtx.runTests();

// Create Deno test context for HOTP
const hotpCtx = createDenoTestContext(
  { assertEquals, assertNotEquals, assertMatch, assertThrows, assertInstanceOf },
  { crypto, base32 },
);

createHOTPDistributionTests(hotpCtx);
hotpCtx.runTests();

// Create Deno test context for TOTP
const totpCtx = createDenoTestContext(
  { assertEquals, assertNotEquals, assertMatch, assertThrows, assertInstanceOf },
  { crypto, base32 },
);

createTOTPDistributionTests(totpCtx);
totpCtx.runTests();

// Create Deno test context for otplib
const otplibCtx = createDenoTestContext(
  { assertEquals, assertNotEquals, assertMatch, assertThrows, assertInstanceOf },
  { crypto, base32 },
);

createOtplibDistributionTests({
  ...otplibCtx,
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
otplibCtx.runTests();
