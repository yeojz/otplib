import { describe, it, expect } from "vitest";
import { defaultCrypto, defaultBase32 } from "./defaults";
import { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

describe("defaults", () => {
  describe("defaultCrypto", () => {
    it("should be an instance of NobleCryptoPlugin", () => {
      expect(defaultCrypto).toBeInstanceOf(NobleCryptoPlugin);
    });

    it("should be frozen", () => {
      expect(Object.isFrozen(defaultCrypto)).toBe(true);
    });
  });

  describe("defaultBase32", () => {
    it("should be an instance of ScureBase32Plugin", () => {
      expect(defaultBase32).toBeInstanceOf(ScureBase32Plugin);
    });

    it("should be frozen", () => {
      expect(Object.isFrozen(defaultBase32)).toBe(true);
    });
  });
});
