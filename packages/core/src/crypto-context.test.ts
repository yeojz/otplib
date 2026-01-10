import { describe, it, expect, vi } from "vitest";
import { CryptoContext, createCryptoContext, stringToBytes } from "./index.js";
import type { CryptoPlugin, HashAlgorithm } from "./types.js";
import { HMACError, RandomBytesError } from "./errors.js";

describe("CryptoContext", () => {
  describe("constructor", () => {
    it("should create instance with crypto plugin", () => {
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn(),
        randomBytes: vi.fn(),
      };
      const context = new CryptoContext(mockPlugin);
      expect(context.plugin).toBe(mockPlugin);
    });
  });

  describe("hmac", () => {
    it("should compute HMAC with sync plugin", async () => {
      const mockResult = stringToBytes("test");
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn().mockReturnValue(mockResult),
        randomBytes: vi.fn(),
      };
      const context = new CryptoContext(mockPlugin);

      const key = stringToBytes("key");
      const data = stringToBytes("data");

      const result = await context.hmac("sha1", key, data);

      expect(result).toEqual(mockResult);
      expect(mockPlugin.hmac).toHaveBeenCalledWith("sha1", key, data);
    });

    it("should compute HMAC with async plugin", async () => {
      const mockResult = stringToBytes("test");
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn().mockResolvedValue(mockResult),
        randomBytes: vi.fn(),
      };
      const context = new CryptoContext(mockPlugin);

      const key = stringToBytes("key");
      const data = stringToBytes("data");

      const result = await context.hmac("sha256", key, data);

      expect(result).toEqual(mockResult);
      expect(mockPlugin.hmac).toHaveBeenCalledWith("sha256", key, data);
    });

    it("should support all hash algorithms", async () => {
      const mockResult = stringToBytes("test");
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn().mockResolvedValue(mockResult),
        randomBytes: vi.fn(),
      };
      const context = new CryptoContext(mockPlugin);

      const algorithms: HashAlgorithm[] = ["sha1", "sha256", "sha512"];
      const key = stringToBytes("key");
      const data = stringToBytes("data");

      for (const algorithm of algorithms) {
        await context.hmac(algorithm, key, data);
        expect(mockPlugin.hmac).toHaveBeenCalledWith(algorithm, key, data);
      }
    });

    it("should throw HMACError on plugin error with cause preserved", async () => {
      const originalError = new Error("Key too short");
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn().mockImplementation(() => {
          throw originalError;
        }),
        randomBytes: vi.fn(),
      };
      const context = new CryptoContext(mockPlugin);

      const key = stringToBytes("key");
      const data = stringToBytes("data");

      await expect(context.hmac("sha1", key, data)).rejects.toThrow(HMACError);
      try {
        await context.hmac("sha1", key, data);
      } catch (error) {
        expect(error).toBeInstanceOf(HMACError);
        expect((error as HMACError).message).toBe("HMAC computation failed: Key too short");
        expect((error as HMACError).cause).toBe(originalError);
      }
    });

    it("should throw HMACError on plugin rejection", async () => {
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn().mockRejectedValue(new Error("Async error")),
        randomBytes: vi.fn(),
      };
      const context = new CryptoContext(mockPlugin);

      const key = stringToBytes("key");
      const data = stringToBytes("data");

      await expect(context.hmac("sha1", key, data)).rejects.toThrow(HMACError);
      await expect(context.hmac("sha1", key, data)).rejects.toThrow(
        "HMAC computation failed: Async error",
      );
    });

    it("should throw HMACError with string error message", async () => {
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn().mockImplementation(() => {
          throw "String error";
        }),
        randomBytes: vi.fn(),
      };
      const context = new CryptoContext(mockPlugin);

      const key = stringToBytes("key");
      const data = stringToBytes("data");

      await expect(context.hmac("sha1", key, data)).rejects.toThrow(HMACError);
    });
  });

  describe("hmacSync", () => {
    it("should compute HMAC synchronously", () => {
      const mockResult = stringToBytes("test");
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn().mockReturnValue(mockResult),
        randomBytes: vi.fn(),
      };
      const context = new CryptoContext(mockPlugin);

      const key = stringToBytes("key");
      const data = stringToBytes("data");

      const result = context.hmacSync("sha1", key, data);

      expect(result).toEqual(mockResult);
      expect(mockPlugin.hmac).toHaveBeenCalledWith("sha1", key, data);
    });

    it("should throw HMACError for async plugin", () => {
      const mockResult = Promise.resolve(stringToBytes("test"));
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn().mockReturnValue(mockResult),
        randomBytes: vi.fn(),
      };
      const context = new CryptoContext(mockPlugin);

      const key = stringToBytes("key");
      const data = stringToBytes("data");

      expect(() => context.hmacSync("sha1", key, data)).toThrow(HMACError);
      expect(() => context.hmacSync("sha1", key, data)).toThrow(
        "HMAC computation failed: Crypto plugin does not support synchronous HMAC operations",
      );
    });

    it("should throw HMACError on plugin error", () => {
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn().mockImplementation(() => {
          throw new Error("Sync error");
        }),
        randomBytes: vi.fn(),
      };
      const context = new CryptoContext(mockPlugin);

      const key = stringToBytes("key");
      const data = stringToBytes("data");

      expect(() => context.hmacSync("sha1", key, data)).toThrow(HMACError);
      expect(() => context.hmacSync("sha1", key, data)).toThrow(
        "HMAC computation failed: Sync error",
      );
    });

    it("should throw HMACError with string error message", () => {
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn().mockImplementation(() => {
          throw "String error";
        }),
        randomBytes: vi.fn(),
      };
      const context = new CryptoContext(mockPlugin);

      const key = stringToBytes("key");
      const data = stringToBytes("data");

      expect(() => context.hmacSync("sha1", key, data)).toThrow(HMACError);
    });
  });

  describe("randomBytes", () => {
    it("should generate random bytes", () => {
      const mockResult = stringToBytes("TestData");
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn(),
        randomBytes: vi.fn().mockReturnValue(mockResult),
      };
      const context = new CryptoContext(mockPlugin);

      const result = context.randomBytes(8);

      expect(result).toEqual(mockResult);
      expect(mockPlugin.randomBytes).toHaveBeenCalledWith(8);
    });

    it("should support different lengths", () => {
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn(),
        randomBytes: vi.fn((length) => new Uint8Array(length)),
      };
      const context = new CryptoContext(mockPlugin);

      const result16 = context.randomBytes(16);
      const result32 = context.randomBytes(32);
      const result64 = context.randomBytes(64);

      expect(result16.length).toBe(16);
      expect(result32.length).toBe(32);
      expect(result64.length).toBe(64);
      expect(mockPlugin.randomBytes).toHaveBeenNthCalledWith(1, 16);
      expect(mockPlugin.randomBytes).toHaveBeenNthCalledWith(2, 32);
      expect(mockPlugin.randomBytes).toHaveBeenNthCalledWith(3, 64);
    });

    it("should throw RandomBytesError on plugin error", () => {
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn(),
        randomBytes: vi.fn().mockImplementation(() => {
          throw new Error("Entropy low");
        }),
      };
      const context = new CryptoContext(mockPlugin);

      expect(() => context.randomBytes(16)).toThrow(RandomBytesError);
      expect(() => context.randomBytes(16)).toThrow("Random byte generation failed: Entropy low");
    });

    it("should throw RandomBytesError with string error message", () => {
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn(),
        randomBytes: vi.fn().mockImplementation(() => {
          throw "String error";
        }),
      };
      const context = new CryptoContext(mockPlugin);

      expect(() => context.randomBytes(16)).toThrow(RandomBytesError);
    });
  });

  describe("plugin getter", () => {
    it("should return the underlying crypto plugin", () => {
      const mockPlugin: CryptoPlugin = {
        name: "mock",
        hmac: vi.fn(),
        randomBytes: vi.fn(),
      };
      const context = new CryptoContext(mockPlugin);

      expect(context.plugin).toBe(mockPlugin);
      expect(context.plugin.name).toBe("mock");
    });
  });
});

describe("createCryptoContext", () => {
  it("should create CryptoContext instance", () => {
    const mockPlugin: CryptoPlugin = {
      name: "mock",
      hmac: vi.fn(),
      randomBytes: vi.fn(),
    };

    const context = createCryptoContext(mockPlugin);

    expect(context).toBeInstanceOf(CryptoContext);
    expect(context.plugin).toBe(mockPlugin);
  });

  it("should be equivalent to constructor", () => {
    const mockPlugin: CryptoPlugin = {
      name: "mock",
      hmac: vi.fn(),
      randomBytes: vi.fn(),
    };

    const context1 = new CryptoContext(mockPlugin);
    const context2 = createCryptoContext(mockPlugin);

    expect(context1.plugin).toBe(context2.plugin);
  });
});
