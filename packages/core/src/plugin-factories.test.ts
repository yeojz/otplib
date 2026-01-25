import { describe, it, expect, vi } from "vitest";
import {
  createBase32Plugin,
  createCryptoPlugin,
  stringToBytes,
  bytesToString,
  Base32DecodeError,
  Base32EncodeError,
} from "./index.js";
import type { Base32Plugin, CryptoPlugin, HashAlgorithm } from "./types.js";

describe("createBase32Plugin", () => {
  describe("basic functionality", () => {
    it("should create a Base32Plugin with custom encode/decode", () => {
      const encode = vi.fn((data: Uint8Array) => bytesToString(data));
      const decode = vi.fn((str: string) => stringToBytes(str));

      const plugin = createBase32Plugin({ encode, decode });

      expect(plugin.name).toBe("custom");
      expect(typeof plugin.encode).toBe("function");
      expect(typeof plugin.decode).toBe("function");
    });

    it("should use custom name when provided", () => {
      const plugin = createBase32Plugin({
        name: "my-plugin",
        encode: bytesToString,
        decode: stringToBytes,
      });

      expect(plugin.name).toBe("my-plugin");
    });

    it("should call encode function with data", () => {
      const encode = vi.fn(() => "encoded");
      const decode = vi.fn();

      const plugin = createBase32Plugin({ encode, decode });
      const data = stringToBytes("test");

      const result = plugin.encode(data);

      expect(encode).toHaveBeenCalledWith(data);
      expect(result).toBe("encoded");
    });

    it("should call decode function with string", () => {
      const encode = vi.fn();
      const decode = vi.fn(() => stringToBytes("decoded"));

      const plugin = createBase32Plugin({ encode, decode });

      const result = plugin.decode("test");

      expect(decode).toHaveBeenCalledWith("test");
      expect(result).toEqual(stringToBytes("decoded"));
    });

    it("should ignore Base32EncodeOptions in encode", () => {
      const encode = vi.fn(() => "encoded");
      const decode = vi.fn();

      const plugin = createBase32Plugin({ encode, decode });
      const data = stringToBytes("test");

      plugin.encode(data, { padding: true });

      expect(encode).toHaveBeenCalledWith(data);
      expect(encode).toHaveBeenCalledTimes(1);
    });
  });

  describe("immutability", () => {
    it("should return a frozen object", () => {
      const plugin = createBase32Plugin({
        encode: bytesToString,
        decode: stringToBytes,
      });

      expect(Object.isFrozen(plugin)).toBe(true);
    });

    it("should not allow property modification", () => {
      const plugin = createBase32Plugin({
        encode: bytesToString,
        decode: stringToBytes,
      });

      expect(() => {
        (plugin as { name: string }).name = "modified";
      }).toThrow();
    });
  });

  describe("type satisfaction", () => {
    it("should satisfy Base32Plugin type", () => {
      const plugin: Base32Plugin = createBase32Plugin({
        encode: bytesToString,
        decode: stringToBytes,
      });

      expect(plugin.name).toBeDefined();
      expect(plugin.encode).toBeDefined();
      expect(plugin.decode).toBeDefined();
    });
  });

  describe("real-world usage", () => {
    it("should work as bypass-as-string", () => {
      const plugin = createBase32Plugin({
        name: "bypass-as-string",
        encode: bytesToString,
        decode: stringToBytes,
      });

      const original = "mysecretkey";
      const bytes = plugin.decode(original);
      const encoded = plugin.encode(bytes);

      expect(encoded).toBe(original);
    });
  });

  describe("error wrapping", () => {
    it("should wrap decode errors in Base32DecodeError", () => {
      const plugin = createBase32Plugin({
        name: "throwing-plugin",
        encode: bytesToString,
        decode: () => {
          throw new Error("Invalid hex format");
        },
      });

      expect(() => plugin.decode("invalid")).toThrow(Base32DecodeError);
    });

    it("should preserve original error message in Base32DecodeError", () => {
      const plugin = createBase32Plugin({
        name: "throwing-plugin",
        encode: bytesToString,
        decode: () => {
          throw new Error("Invalid hex format");
        },
      });

      expect(() => plugin.decode("invalid")).toThrow(/Invalid hex format/);
    });

    it("should preserve original error as cause in Base32DecodeError", () => {
      const originalError = new Error("Original decode error");
      const plugin = createBase32Plugin({
        name: "throwing-plugin",
        encode: bytesToString,
        decode: () => {
          throw originalError;
        },
      });

      try {
        plugin.decode("invalid");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Base32DecodeError);
        expect((error as Base32DecodeError).cause).toBe(originalError);
      }
    });

    it("should wrap encode errors in Base32EncodeError", () => {
      const plugin = createBase32Plugin({
        name: "throwing-plugin",
        encode: () => {
          throw new Error("Encode failed");
        },
        decode: stringToBytes,
      });

      expect(() => plugin.encode(new Uint8Array([1, 2, 3]))).toThrow(Base32EncodeError);
    });

    it("should preserve original error as cause in Base32EncodeError", () => {
      const originalError = new Error("Original encode error");
      const plugin = createBase32Plugin({
        name: "throwing-plugin",
        encode: () => {
          throw originalError;
        },
        decode: stringToBytes,
      });

      try {
        plugin.encode(new Uint8Array([1, 2, 3]));
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Base32EncodeError);
        expect((error as Base32EncodeError).cause).toBe(originalError);
      }
    });

    it("should handle non-Error thrown values in encode", () => {
      const plugin = createBase32Plugin({
        name: "throwing-plugin",
        encode: () => {
          throw "string error";
        },
        decode: stringToBytes,
      });

      expect(() => plugin.encode(new Uint8Array([1, 2, 3]))).toThrow(Base32EncodeError);
      expect(() => plugin.encode(new Uint8Array([1, 2, 3]))).toThrow(/string error/);
    });

    it("should handle non-Error thrown values in decode", () => {
      const plugin = createBase32Plugin({
        name: "throwing-plugin",
        encode: bytesToString,
        decode: () => {
          throw "string error";
        },
      });

      expect(() => plugin.decode("invalid")).toThrow(Base32DecodeError);
      expect(() => plugin.decode("invalid")).toThrow(/string error/);
    });
  });
});

describe("createCryptoPlugin", () => {
  describe("basic functionality", () => {
    it("should create a CryptoPlugin with custom functions", () => {
      const hmac = vi.fn();
      const randomBytes = vi.fn();

      const plugin = createCryptoPlugin({ hmac, randomBytes });

      expect(plugin.name).toBe("custom");
      expect(typeof plugin.hmac).toBe("function");
      expect(typeof plugin.randomBytes).toBe("function");
      expect(typeof plugin.constantTimeEqual).toBe("function");
    });

    it("should use custom name when provided", () => {
      const plugin = createCryptoPlugin({
        name: "my-crypto",
        hmac: vi.fn(),
        randomBytes: vi.fn(),
      });

      expect(plugin.name).toBe("my-crypto");
    });

    it("should call hmac function with correct arguments", async () => {
      const mockResult = stringToBytes("hmac-result");
      const hmac = vi.fn().mockReturnValue(mockResult);
      const randomBytes = vi.fn();

      const plugin = createCryptoPlugin({ hmac, randomBytes });

      const key = stringToBytes("key");
      const data = stringToBytes("data");
      const result = await plugin.hmac("sha1", key, data);

      expect(hmac).toHaveBeenCalledWith("sha1", key, data);
      expect(result).toEqual(mockResult);
    });

    it("should call randomBytes function with length", () => {
      const mockResult = new Uint8Array(20);
      const hmac = vi.fn();
      const randomBytes = vi.fn().mockReturnValue(mockResult);

      const plugin = createCryptoPlugin({ hmac, randomBytes });

      const result = plugin.randomBytes(20);

      expect(randomBytes).toHaveBeenCalledWith(20);
      expect(result).toEqual(mockResult);
    });

    it("should support async hmac", async () => {
      const mockResult = stringToBytes("async-result");
      const hmac = vi.fn().mockResolvedValue(mockResult);
      const randomBytes = vi.fn();

      const plugin = createCryptoPlugin({ hmac, randomBytes });

      const key = stringToBytes("key");
      const data = stringToBytes("data");
      const result = await plugin.hmac("sha256", key, data);

      expect(result).toEqual(mockResult);
    });

    it("should support all hash algorithms", async () => {
      const hmac = vi.fn().mockReturnValue(new Uint8Array(20));
      const randomBytes = vi.fn();

      const plugin = createCryptoPlugin({ hmac, randomBytes });

      const algorithms: HashAlgorithm[] = ["sha1", "sha256", "sha512"];
      const key = stringToBytes("key");
      const data = stringToBytes("data");

      for (const algorithm of algorithms) {
        await plugin.hmac(algorithm, key, data);
        expect(hmac).toHaveBeenCalledWith(algorithm, key, data);
      }
    });
  });

  describe("constantTimeEqual", () => {
    it("should use custom constantTimeEqual when provided", () => {
      const customCte = vi.fn().mockReturnValue(true);
      const plugin = createCryptoPlugin({
        hmac: vi.fn(),
        randomBytes: vi.fn(),
        constantTimeEqual: customCte,
      });

      const result = plugin.constantTimeEqual("a", "a");

      expect(customCte).toHaveBeenCalledWith("a", "a");
      expect(result).toBe(true);
    });

    it("should fall back to core constantTimeEqual when not provided", () => {
      const plugin = createCryptoPlugin({
        hmac: vi.fn(),
        randomBytes: vi.fn(),
      });

      expect(plugin.constantTimeEqual("test", "test")).toBe(true);
      expect(plugin.constantTimeEqual("test", "other")).toBe(false);
    });

    it("should work with Uint8Array in fallback", () => {
      const plugin = createCryptoPlugin({
        hmac: vi.fn(),
        randomBytes: vi.fn(),
      });

      const a = stringToBytes("test");
      const b = stringToBytes("test");
      const c = stringToBytes("other");

      expect(plugin.constantTimeEqual(a, b)).toBe(true);
      expect(plugin.constantTimeEqual(a, c)).toBe(false);
    });
  });

  describe("immutability", () => {
    it("should return a frozen object", () => {
      const plugin = createCryptoPlugin({
        hmac: vi.fn(),
        randomBytes: vi.fn(),
      });

      expect(Object.isFrozen(plugin)).toBe(true);
    });

    it("should not allow property modification", () => {
      const plugin = createCryptoPlugin({
        hmac: vi.fn(),
        randomBytes: vi.fn(),
      });

      expect(() => {
        (plugin as { name: string }).name = "modified";
      }).toThrow();
    });
  });

  describe("type satisfaction", () => {
    it("should satisfy CryptoPlugin type", () => {
      const plugin: CryptoPlugin = createCryptoPlugin({
        hmac: vi.fn(),
        randomBytes: vi.fn(),
      });

      expect(plugin.name).toBeDefined();
      expect(plugin.hmac).toBeDefined();
      expect(plugin.randomBytes).toBeDefined();
      expect(plugin.constantTimeEqual).toBeDefined();
    });
  });
});
