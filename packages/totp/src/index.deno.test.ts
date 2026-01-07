/**
 * TOTP tests for Deno runtime
 *
 * Uses the shared test suite with NobleCryptoPlugin.
 * Run from repo root with: deno test --allow-read packages/totp/src/index.deno.test.ts
 */
import {
  assertEquals,
  assertNotEquals,
  assertMatch,
  assertThrows,
  assertInstanceOf,
} from "@std/assert";
import { NobleCryptoPlugin } from "../../plugin-crypto-noble/dist/index.js";
import { createDenoTestContext } from "@repo/testing";
import { createTOTPTests } from "./index-test.ts";

const ctx = createDenoTestContext(
  { assertEquals, assertNotEquals, assertMatch, assertThrows, assertInstanceOf },
  { crypto: new NobleCryptoPlugin() },
);

createTOTPTests(ctx);
ctx.runTests();
