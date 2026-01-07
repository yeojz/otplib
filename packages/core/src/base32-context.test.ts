import { describe, it, expect, vi } from "vitest";
import {
  Base32Context,
  createBase32Context,
  stringToBytes,
  Base32DecodeError,
  Base32EncodeError,
} from "./index.js";
import type { Base32Plugin, Base32EncodeOptions } from "./types.js";

describe("Base32Context", () => {
  describe("constructor", () => {
    it("should create instance with Base32 plugin", () => {
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn(),
        decode: vi.fn(),
      };
      const context = new Base32Context(mockPlugin);
      expect(context.plugin).toBe(mockPlugin);
    });
  });

  describe("encode", () => {
    it("should encode data using plugin", () => {
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn().mockReturnValue("MFRGGZDFMZTWQ==="),
        decode: vi.fn(),
      };
      const context = new Base32Context(mockPlugin);

      const data = stringToBytes("hello");
      const result = context.encode(data);

      expect(result).toBe("MFRGGZDFMZTWQ===");
      expect(mockPlugin.encode).toHaveBeenCalledWith(data, undefined);
    });

    it("should pass options to plugin", () => {
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn().mockReturnValue("MFRGGZDFMZTWQ"),
        decode: vi.fn(),
      };
      const context = new Base32Context(mockPlugin);

      const data = stringToBytes("test");
      const options: Base32EncodeOptions = { padding: false };
      const result = context.encode(data, options);

      expect(result).toBe("MFRGGZDFMZTWQ");
      expect(mockPlugin.encode).toHaveBeenCalledWith(data, options);
    });

    it("should support padding option", () => {
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn().mockImplementation((_data, options) => {
          const { padding = true } = options || {};
          return padding ? "MFRGGZDFMZTWQ===" : "MFRGGZDFMZTWQ";
        }),
        decode: vi.fn(),
      };
      const context = new Base32Context(mockPlugin);

      const data = stringToBytes("data");

      const withPadding = context.encode(data, { padding: true });
      const withoutPadding = context.encode(data, { padding: false });
      const defaultPadding = context.encode(data);

      expect(withPadding).toBe("MFRGGZDFMZTWQ===");
      expect(withoutPadding).toBe("MFRGGZDFMZTWQ");
      expect(defaultPadding).toBe("MFRGGZDFMZTWQ===");
    });

    it("should handle empty data", () => {
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn().mockReturnValue(""),
        decode: vi.fn(),
      };
      const context = new Base32Context(mockPlugin);

      const data = new Uint8Array(0);
      const result = context.encode(data);

      expect(result).toBe("");
      expect(mockPlugin.encode).toHaveBeenCalledWith(data, undefined);
    });

    it("should handle larger data", () => {
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn().mockReturnValue("MFRGGZDFMZTWQ2LKNNWG2TSMNZXHA4LPO6YICNOBUXWS5TFFRXGZA="),
        decode: vi.fn(),
      };
      const context = new Base32Context(mockPlugin);

      const result = context.encode(
        new Uint8Array(Array.from({ length: 20 }, () => Math.floor(Math.random() * 256))),
      );

      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
      expect(mockPlugin.encode).toHaveBeenCalled();
    });
  });

  describe("decode", () => {
    it("should decode string using plugin", () => {
      const mockData = stringToBytes("hello");
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn(),
        decode: vi.fn().mockReturnValue(mockData),
      };
      const context = new Base32Context(mockPlugin);

      const str = "MFRGGZDFMZTWQ===";
      const result = context.decode(str);

      expect(result).toEqual(mockData);
      expect(mockPlugin.decode).toHaveBeenCalledWith(str);
    });

    it("should decode string without padding", () => {
      const mockData = stringToBytes("hello");
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn(),
        decode: vi.fn().mockReturnValue(mockData),
      };
      const context = new Base32Context(mockPlugin);

      const str = "MFRGGZDFMZTWQ";
      const result = context.decode(str);

      expect(result).toEqual(mockData);
      expect(mockPlugin.decode).toHaveBeenCalledWith(str);
    });

    it("should handle empty string", () => {
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn(),
        decode: vi.fn().mockReturnValue(stringToBytes("")),
      };
      const context = new Base32Context(mockPlugin);

      const result = context.decode("");

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
      expect(mockPlugin.decode).toHaveBeenCalledWith("");
    });

    it("should throw Base32DecodeError for invalid string from plugin with Error object", () => {
      const originalError = new Error("Invalid Base32 string");
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn(),
        decode: vi.fn().mockImplementation(() => {
          throw originalError;
        }),
      };
      const context = new Base32Context(mockPlugin);

      expect(() => context.decode("invalid!@#")).toThrow(Base32DecodeError);
      try {
        context.decode("invalid!@#");
      } catch (error) {
        expect(error).toBeInstanceOf(Base32DecodeError);
        expect((error as Base32DecodeError).message).toContain("Invalid Base32 string");
        expect((error as Base32DecodeError).cause).toBe(originalError);
      }
    });

    it("should throw Base32DecodeError for invalid string from plugin with non-Error value", () => {
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn(),
        decode: vi.fn().mockImplementation(() => {
          throw 42;
        }),
      };
      const context = new Base32Context(mockPlugin);

      expect(() => context.decode("invalid!@#")).toThrow(Base32DecodeError);
      try {
        context.decode("invalid!@#");
      } catch (error) {
        expect(error).toBeInstanceOf(Base32DecodeError);
        expect((error as Base32DecodeError).message).toContain("42");
        expect((error as Base32DecodeError).cause).toBe(42);
      }
    });

    it("should throw Base32EncodeError when encoding fails with Error object", () => {
      const originalError = new Error("Encoding failed");
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn().mockImplementation(() => {
          throw originalError;
        }),
        decode: vi.fn(),
      };
      const context = new Base32Context(mockPlugin);

      expect(() => context.encode(new Uint8Array([1, 2, 3]))).toThrow(Base32EncodeError);
      try {
        context.encode(new Uint8Array([1, 2, 3]));
      } catch (error) {
        expect(error).toBeInstanceOf(Base32EncodeError);
        expect((error as Base32EncodeError).message).toContain("Encoding failed");
        expect((error as Base32EncodeError).cause).toBe(originalError);
      }
    });

    it("should throw Base32EncodeError when encoding fails with non-Error value", () => {
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn().mockImplementation(() => {
          throw "string error";
        }),
        decode: vi.fn(),
      };
      const context = new Base32Context(mockPlugin);

      expect(() => context.encode(new Uint8Array([1, 2, 3]))).toThrow(Base32EncodeError);
      try {
        context.encode(new Uint8Array([1, 2, 3]));
      } catch (error) {
        expect(error).toBeInstanceOf(Base32EncodeError);
        expect((error as Base32EncodeError).message).toContain("string error");
        expect((error as Base32EncodeError).cause).toBe("string error");
      }
    });

    it("should handle uppercase and lowercase", () => {
      const mockData = stringToBytes("hello");
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn(),
        decode: vi.fn().mockReturnValue(mockData),
      };
      const context = new Base32Context(mockPlugin);

      const uppercase = "MFRGGZDFMZTWQ===";
      const lowercase = "mfrggzdfmztwq===";

      const result1 = context.decode(uppercase);
      const result2 = context.decode(lowercase);

      expect(result1).toEqual(mockData);
      expect(result2).toEqual(mockData);
      expect(mockPlugin.decode).toHaveBeenCalledTimes(2);
    });
  });

  describe("plugin getter", () => {
    it("should return the underlying Base32 plugin", () => {
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn(),
        decode: vi.fn(),
      };
      const context = new Base32Context(mockPlugin);

      expect(context.plugin).toBe(mockPlugin);
      expect(context.plugin.name).toBe("mock");
    });
  });

  describe("integration", () => {
    it("should encode and decode consistently", () => {
      const originalData = stringToBytes("helloWorld!");

      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn(() => {
          // Simple mock encoding - just return a fixed string
          return "MFRGGZDFMZTWQ2LKNNZA====";
        }),
        decode: vi.fn(() => {
          // Simple mock decoding - return original data
          return originalData;
        }),
      };
      const context = new Base32Context(mockPlugin);

      const encoded = context.encode(originalData, { padding: false });
      const decoded = context.decode(encoded);

      expect(encoded).toBe("MFRGGZDFMZTWQ2LKNNZA====");
      expect(decoded).toEqual(originalData);
      expect(mockPlugin.encode).toHaveBeenCalled();
      expect(mockPlugin.decode).toHaveBeenCalled();
    });

    it("should handle multiple operations", () => {
      const mockPlugin: Base32Plugin = {
        name: "mock",
        encode: vi.fn().mockReturnValue("ABCDEF"),
        decode: vi.fn().mockReturnValue(stringToBytes("abc")),
      };
      const context = new Base32Context(mockPlugin);

      // Multiple encode operations
      context.encode(stringToBytes("A"));
      context.encode(stringToBytes("B"));
      context.encode(stringToBytes("C"));

      expect(mockPlugin.encode).toHaveBeenCalledTimes(3);

      // Multiple decode operations
      context.decode("ABCDEF");
      context.decode("ABCDEF");

      expect(mockPlugin.decode).toHaveBeenCalledTimes(2);
    });
  });
});

describe("createBase32Context", () => {
  it("should create Base32Context instance", () => {
    const mockPlugin: Base32Plugin = {
      name: "mock",
      encode: vi.fn(),
      decode: vi.fn(),
    };

    const context = createBase32Context(mockPlugin);

    expect(context).toBeInstanceOf(Base32Context);
    expect(context.plugin).toBe(mockPlugin);
  });

  it("should be equivalent to constructor", () => {
    const mockPlugin: Base32Plugin = {
      name: "mock",
      encode: vi.fn(),
      decode: vi.fn(),
    };

    const context1 = new Base32Context(mockPlugin);
    const context2 = createBase32Context(mockPlugin);

    expect(context1.plugin).toBe(context2.plugin);
  });

  it("should create independent contexts", () => {
    const mockPlugin1: Base32Plugin = {
      name: "mock1",
      encode: vi.fn().mockReturnValue("ABC"),
      decode: vi.fn(),
    };
    const mockPlugin2: Base32Plugin = {
      name: "mock2",
      encode: vi.fn().mockReturnValue("DEF"),
      decode: vi.fn(),
    };

    const context1 = createBase32Context(mockPlugin1);
    const context2 = createBase32Context(mockPlugin2);

    expect(context1.plugin).not.toBe(context2.plugin);
    expect(context1.encode(stringToBytes("A"))).toBe("ABC");
    expect(context2.encode(stringToBytes("A"))).toBe("DEF");
  });
});
