import { RFC4226_VECTORS, BASE_SECRET } from "./rfc-test-vectors.js";
import { counterToBytes, hexToBytes, stringToBytes } from "./utils.js";

import type { ExpectFn } from "./types.js";

/**
 * Minimal interface for crypto plugin
 */
interface CryptoPlugin {
  hmac(algorithm: string, secret: Uint8Array, counter: Uint8Array): Promise<Uint8Array>;
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
