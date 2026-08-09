import { describe, it, expect, vi } from "vitest";
import {
  CryptoContext,
  createCryptoContext,
  normalizeHashAlgorithm,
  stringToBytes,
} from "./index.js";
import type { CryptoPlugin, HashAlgorithm } from "./types.js";
import { AlgorithmUnsupportedError, HMACError, RandomBytesError } from "./errors.js";

/**
 * A plugin narrowed to sha1 only that validates internally but does not declare
 * `algorithms`, so its rejection fires inside the context's try block after the
 * context's own check has passed.
 */
function createSha1OnlyPlugin(): CryptoPlugin {
  return {
    name: "sha1-only",
    hmac: (algorithm: HashAlgorithm) => {
      normalizeHashAlgorithm(algorithm, { supported: ["sha1"], plugin: "sha1-only" });
      return stringToBytes("digest");
    },
    randomBytes: vi.fn(),
  };
}

/**
 * A plugin that declares its narrowed set, so the context can reject an
 * unsupported algorithm before delegating. `hmac` is a spy with no validation
 * of its own, which is what lets the tests assert it was never reached.
 */
function createDeclaredSha1OnlyPlugin(): CryptoPlugin {
  return {
    name: "declared-sha1-only",
    algorithms: ["sha1"],
    hmac: vi.fn().mockReturnValue(stringToBytes("digest")),
    randomBytes: vi.fn(),
  };
}

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

    // The context validates against the full set before delegating, so a
    // narrowed plugin's rejection happens inside the try block. It must escape
    // as the algorithm error it is, not disguised as an HMAC failure.
    it("should not rewrap a narrowed plugin's algorithm rejection", async () => {
      const context = new CryptoContext(createSha1OnlyPlugin());

      const key = stringToBytes("key");
      const data = stringToBytes("data");

      await expect(context.hmac("sha256", key, data)).rejects.toThrow(AlgorithmUnsupportedError);
      await expect(context.hmac("sha256", key, data)).rejects.toThrow("[plugin: sha1-only]");
      await expect(context.hmac("sha1", key, data)).resolves.toBeInstanceOf(Uint8Array);
    });

    it("should reject an algorithm a plugin declares it cannot compute", async () => {
      const plugin = createDeclaredSha1OnlyPlugin();
      const context = new CryptoContext(plugin);

      const key = stringToBytes("key");
      const data = stringToBytes("data");

      await expect(context.hmac("sha512", key, data)).rejects.toThrow(AlgorithmUnsupportedError);
      // Rejected by the context, so the plugin is never asked.
      expect(plugin.hmac).not.toHaveBeenCalled();

      await expect(context.hmac("sha1", key, data)).resolves.toBeInstanceOf(Uint8Array);
      expect(plugin.hmac).toHaveBeenCalledTimes(1);
    });

    it("should report only the plugin's own set when it declares one", async () => {
      const context = new CryptoContext(createDeclaredSha1OnlyPlugin());

      await expect(
        context.hmac("sha512", stringToBytes("key"), stringToBytes("data")),
      ).rejects.toThrow("Expected one of: sha1 ");
    });

    // A declaration must never re-enable a digest the library refuses.
    it("should not let a plugin declaration widen the allowlist", async () => {
      const plugin: CryptoPlugin = {
        name: "widened",
        algorithms: ["md5", "sha1"] as unknown as HashAlgorithm[],
        hmac: vi.fn().mockReturnValue(stringToBytes("digest")),
        randomBytes: vi.fn(),
      };
      const context = new CryptoContext(plugin);

      await expect(
        context.hmac("md5" as HashAlgorithm, stringToBytes("key"), stringToBytes("data")),
      ).rejects.toThrow(AlgorithmUnsupportedError);
      expect(plugin.hmac).not.toHaveBeenCalled();
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

    it("should not rewrap a narrowed plugin's algorithm rejection", () => {
      const context = new CryptoContext(createSha1OnlyPlugin());

      const key = stringToBytes("key");
      const data = stringToBytes("data");

      expect(() => context.hmacSync("sha256", key, data)).toThrow(AlgorithmUnsupportedError);
      expect(() => context.hmacSync("sha256", key, data)).toThrow("[plugin: sha1-only]");
      expect(context.hmacSync("sha1", key, data)).toBeInstanceOf(Uint8Array);
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
