import { describe, it, expect } from "vitest";
import { BASE_SECRET_BASE32 } from "@repo/testing";
import { hasPlugins, hasCrypto, hasBase32 } from "./utility-types.js";
import type { CryptoPlugin, Base32Plugin } from "./types.js";
import { stringToBytes } from "./utils.js";

// Mock crypto plugin for testing
const mockCryptoPlugin: CryptoPlugin = {
  name: "mock",
  hmac: () => new Uint8Array(20),
  randomBytes: (length: number) => new Uint8Array(length),
  constantTimeEqual: () => true,
};

// Mock base32 plugin for testing
const mockBase32Plugin: Base32Plugin = {
  name: "mock",
  encode: () => BASE_SECRET_BASE32,
  decode: () => stringToBytes("Hello"),
};

describe("utility-types", () => {
  describe("hasPlugins", () => {
    it("should return true when both plugins are defined", () => {
      const options = {
        crypto: mockCryptoPlugin,
        base32: mockBase32Plugin,
      };

      expect(hasPlugins(options)).toBe(true);
    });

    it("should return false when crypto is undefined", () => {
      const options = {
        crypto: undefined,
        base32: mockBase32Plugin,
      };

      expect(hasPlugins(options)).toBe(false);
    });

    it("should return false when base32 is undefined", () => {
      const options = {
        crypto: mockCryptoPlugin,
        base32: undefined,
      };

      expect(hasPlugins(options)).toBe(false);
    });

    it("should return false when both plugins are undefined", () => {
      const options = {
        crypto: undefined,
        base32: undefined,
      };

      expect(hasPlugins(options)).toBe(false);
    });

    it("should work with additional properties in options", () => {
      const options = {
        crypto: mockCryptoPlugin,
        base32: mockBase32Plugin,
        secret: BASE_SECRET_BASE32,
        digits: 6,
      };

      expect(hasPlugins(options)).toBe(true);
    });
  });

  describe("hasCrypto", () => {
    it("should return true when crypto is defined", () => {
      const options = {
        crypto: mockCryptoPlugin,
      };

      expect(hasCrypto(options)).toBe(true);
    });

    it("should return false when crypto is undefined", () => {
      const options = {
        crypto: undefined,
      };

      expect(hasCrypto(options)).toBe(false);
    });

    it("should work with additional properties", () => {
      const options = {
        crypto: mockCryptoPlugin,
        digits: 6,
        algorithm: "sha256" as const,
      };

      expect(hasCrypto(options)).toBe(true);
    });
  });

  describe("hasBase32", () => {
    it("should return true when base32 is defined", () => {
      const options = {
        base32: mockBase32Plugin,
      };

      expect(hasBase32(options)).toBe(true);
    });

    it("should return false when base32 is undefined", () => {
      const options = {
        base32: undefined,
      };

      expect(hasBase32(options)).toBe(false);
    });

    it("should work with additional properties", () => {
      const options = {
        base32: mockBase32Plugin,
        secret: BASE_SECRET_BASE32,
      };

      expect(hasBase32(options)).toBe(true);
    });
  });

  describe("type narrowing", () => {
    it("should narrow types correctly with hasPlugins", () => {
      const options: { crypto?: CryptoPlugin; base32?: Base32Plugin } = {
        crypto: mockCryptoPlugin,
        base32: mockBase32Plugin,
      };

      if (hasPlugins(options)) {
        // TypeScript should know these are defined
        expect(options.crypto.name).toBe("mock");
        expect(options.base32.name).toBe("mock");
      }
    });

    it("should narrow types correctly with hasCrypto", () => {
      const options: { crypto?: CryptoPlugin } = {
        crypto: mockCryptoPlugin,
      };

      if (hasCrypto(options)) {
        // TypeScript should know crypto is defined
        expect(options.crypto.name).toBe("mock");
      }
    });

    it("should narrow types correctly with hasBase32", () => {
      const options: { base32?: Base32Plugin } = {
        base32: mockBase32Plugin,
      };

      if (hasBase32(options)) {
        // TypeScript should know base32 is defined
        expect(options.base32.name).toBe("mock");
      }
    });
  });
});
