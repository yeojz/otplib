/**
 * TOTP tests for Node.js/Vitest
 *
 * Uses the shared test suite with NodeCryptoPlugin.
 */
import { describe, it, expect } from "vitest";
import { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
import { createTOTPTests } from "./index-test.ts";

createTOTPTests({
  describe,
  it,
  expect,
  crypto: new NodeCryptoPlugin(),
});
