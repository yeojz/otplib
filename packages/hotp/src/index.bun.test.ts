/**
 * HOTP tests for Bun runtime
 *
 * Uses the shared test suite with NobleCryptoPlugin.
 * Run with: bun test packages/hotp/src/index.bun.test.ts
 *
 * Note: Uses dist files due to workspace package resolution issues in Bun.
 */
import { describe, it, expect } from "bun:test";
import { NobleCryptoPlugin } from "../../plugin-crypto-noble/dist/index.js";
import { createHOTPTests } from "./index-test.js";

createHOTPTests({
  describe,
  it,
  expect,
  crypto: new NobleCryptoPlugin(),
});
