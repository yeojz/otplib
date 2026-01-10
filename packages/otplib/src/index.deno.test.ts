/**
 * otplib tests for Deno runtime
 *
 * Uses the shared test suite with NobleCryptoPlugin and ScureBase32Plugin.
 * Run from repo root with: deno test --allow-read packages/otplib/src/index.deno.test.ts
 */
import {
  assertEquals,
  assertNotEquals,
  assertMatch,
  assertThrows,
  assertInstanceOf,
} from "@std/assert";
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
import { createDenoTestContext } from "@repo/testing";
import { createOtplibTests, type OtplibTestContext } from "./index-test.ts";

const baseCtx = createDenoTestContext(
  { assertEquals, assertNotEquals, assertMatch, assertThrows, assertInstanceOf },
  {
    crypto: new NobleCryptoPlugin(),
    base32: new ScureBase32Plugin(),
  },
);

const ctx: OtplibTestContext = {
  ...baseCtx,
  otplib: {
    generateSecret,
    generateURI,
    generate,
    generateSync,
    verify,
    verifySync,
    TOTP: TOTP as unknown as OtplibTestContext["otplib"]["TOTP"],
    OTP: OTP as unknown as OtplibTestContext["otplib"]["OTP"],
  },
};

createOtplibTests(ctx);
baseCtx.runTests();
