import { describe, it, expect } from "vitest";
import { HOTP, HashAlgorithms } from "./index";
import { RFC4226_VECTORS, BASE_SECRET } from "@repo/testing";

describe("HOTP (v11-adapter)", () => {
  it("should match RFC 4226 vectors", () => {
    const hotp = new HOTP({
      algorithm: HashAlgorithms.SHA1,
      digits: 6,
    });

    RFC4226_VECTORS.forEach(({ counter, expected }) => {
      expect(hotp.generate(BASE_SECRET, counter)).toBe(expected);
    });
  });

  it("should check token correctly", () => {
    const hotp = new HOTP();
    const token = hotp.generate(BASE_SECRET, 0);
    expect(hotp.check(token, BASE_SECRET, 0)).toBe(true);
    expect(hotp.check(token, BASE_SECRET, 1)).toBe(false);
  });
});
