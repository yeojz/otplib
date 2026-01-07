import { RFC4226_VECTORS, BASE_SECRET } from "./rfc-test-vectors.js";

import type { ExpectFn } from "./types.js";

/**
 * Minimal interface for crypto plugin
 */
interface CryptoPlugin {
  hmac(algorithm: string, secret: Uint8Array, counter: Uint8Array): Promise<Uint8Array>;
}

/**
 * Internal utility to convert string to bytes
 */
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Internal utility to convert counter to 8-byte big-endian array
 */
function counterToBytes(value: number | bigint): Uint8Array {
  const bigintValue = typeof value === "bigint" ? value : BigInt(value);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, bigintValue, false);
  return new Uint8Array(buffer);
}

/**
 * Internal utility to convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Test a crypto plugin against RFC 4226 Appendix D intermediate HMAC values
 *
 * This helper allows crypto plugins to verify their HMAC-SHA1 implementation
 * matches the exact intermediate values specified in RFC 4226 Appendix D, Table 1.
 *
 * @param plugin - The crypto plugin to test
 * @param expect - Test framework expect function
 *
 * @example
 * ```ts
 * import { describe, it, expect } from "vitest";
 * import { testRFC4226HMAC } from "@repo/testing";
 * import { NodeCryptoPlugin } from "./index";
 *
 * describe("NodeCryptoPlugin RFC compliance", () => {
 *   it("should match RFC 4226 intermediate HMAC values", async () => {
 *     const plugin = new NodeCryptoPlugin();
 *     await testRFC4226HMAC(plugin, expect);
 *   });
 * });
 * ```
 */
export async function testRFC4226HMAC(plugin: CryptoPlugin, expect: ExpectFn): Promise<void> {
  const secret = stringToBytes(BASE_SECRET);

  for (const vector of RFC4226_VECTORS) {
    const counter = counterToBytes(vector.counter);
    const actualHmac = await plugin.hmac("sha1", secret, counter);
    const expectedHmac = hexToBytes(vector.hmac);

    expect(actualHmac).toEqual(expectedHmac);
  }
}
