/**
 * HOTP tests for Node.js/Vitest
 *
 * Uses the shared test suite with NodeCryptoPlugin.
 */
import { describe, it, expect } from "vitest";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { createHOTPTests } from "./index-test";

createHOTPTests({
  describe,
  it,
  expect,
  crypto: new NodeCryptoPlugin(),
});
