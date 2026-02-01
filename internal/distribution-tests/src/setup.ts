/**
 * Distribution test setup
 *
 * This file imports from the BUILT packages (dist/) rather than source files.
 * This ensures we're testing the actual published artifacts.
 */

// Re-export from built packages for use in tests
export { NodeCryptoPlugin } from "@otplib/plugin-crypto-node";
export { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
export { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

// Re-export testing utilities
export { RFC4226_VECTORS, RFC6238_VECTORS, BASE_SECRET, hexToNumber } from "@repo/testing";
export type { TestContext } from "@repo/testing";
