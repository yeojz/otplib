import crypto from "node:crypto";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ErrorCodes, OtplibxStorageError } from "./errors.js";
import { nativeAesStorage } from "./native-aes.js";

vi.mock("node:fs");
vi.mock("node:crypto");

describe("native-aes storage", () => {
  const testKey = "a".repeat(64); // 64 hex chars = 32 bytes
  const testKeyBuffer = Buffer.from(testKey, "hex");
  const testIv = Buffer.alloc(12, 0x01);
  const testAuthTag = Buffer.alloc(16, 0x02);

  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.OTPLIBX_ENCRYPTION_KEY;
  });

  afterEach(() => {
    delete process.env.OTPLIBX_ENCRYPTION_KEY;
  });

  describe("status", () => {
    test("returns not initialized when file does not exist", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const status = await nativeAesStorage.status(".env.otplibx");

      expect(status.initialized).toBe(false);
      expect(status.keySource).toBe(null);
      expect(status.envPath).toBe(null);
    });

    test("returns initialized with env key source", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      process.env.OTPLIBX_ENCRYPTION_KEY = testKey;

      const status = await nativeAesStorage.status(".env.otplibx");

      expect(status.initialized).toBe(true);
      expect(status.keySource).toBe("env");
      expect(status.envPath).toBe(".env.otplibx");
    });

    test("returns initialized with file key source", async () => {
      vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
        const pathStr = p.toString();
        return pathStr === ".env.otplibx" || pathStr === ".env.keys";
      });
      vi.mocked(fs.readFileSync).mockReturnValue(`OTPLIBX_ENCRYPTION_KEY=${testKey}`);

      const status = await nativeAesStorage.status(".env.otplibx");

      expect(status.initialized).toBe(true);
      expect(status.keySource).toBe("file");
      expect(status.keysPath).toBe(".env.keys");
    });

    test("returns not initialized when keys file exists but has no encryption key", async () => {
      vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
        const pathStr = p.toString();
        return pathStr === ".env.otplibx" || pathStr === ".env.keys";
      });
      vi.mocked(fs.readFileSync).mockReturnValue("OTHER_KEY=somevalue");

      const status = await nativeAesStorage.status(".env.otplibx");

      expect(status.initialized).toBe(false);
      expect(status.keySource).toBe(null);
      expect(status.keysPath).toBe(".env.keys");
    });
  });

  describe("init", () => {
    test("throws when file already exists", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      await expect(nativeAesStorage.init(".env.otplibx")).rejects.toThrow(OtplibxStorageError);

      try {
        await nativeAesStorage.init(".env.otplibx");
      } catch (err) {
        expect((err as OtplibxStorageError).code).toBe(ErrorCodes.ALREADY_INITIALIZED);
      }
    });

    test("creates keys file and env file", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(crypto.randomBytes).mockReturnValue(Buffer.alloc(32, 0xab) as unknown as void);

      await nativeAesStorage.init(".env.otplibx");

      // Should write keys file
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        ".env.keys",
        expect.stringContaining("OTPLIBX_ENCRYPTION_KEY="),
        { mode: 0o600 },
      );

      // Should write env file
      expect(fs.writeFileSync).toHaveBeenCalledWith(".env.otplibx", "", {
        mode: 0o600,
      });
    });
  });

  describe("load", () => {
    test("throws when file does not exist", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(nativeAesStorage.load(".env.otplibx")).rejects.toThrow(OtplibxStorageError);
    });

    test("throws when no key is found", async () => {
      vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
        return p.toString() === ".env.otplibx";
      });

      try {
        await nativeAesStorage.load(".env.otplibx");
      } catch (err) {
        expect(err).toBeInstanceOf(OtplibxStorageError);
        expect((err as OtplibxStorageError).code).toBe(ErrorCodes.NOT_INITIALIZED);
      }
    });

    test("decrypts values using env key", async () => {
      process.env.OTPLIBX_ENCRYPTION_KEY = testKey;
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const encryptedPayload = Buffer.concat([testIv, testAuthTag, Buffer.from("encrypted")]);
      vi.mocked(fs.readFileSync).mockReturnValue(
        `KEY=encrypted:${encryptedPayload.toString("base64")}`,
      );

      const mockDecipher = {
        update: vi.fn().mockReturnValue(Buffer.from("decrypted")),
        final: vi.fn().mockReturnValue(Buffer.alloc(0)),
        setAuthTag: vi.fn(),
      };
      vi.mocked(crypto.createDecipheriv).mockReturnValue(
        mockDecipher as unknown as crypto.DecipherGCM,
      );

      const result = await nativeAesStorage.load(".env.otplibx");

      expect(result.KEY).toBe("decrypted");
      expect(crypto.createDecipheriv).toHaveBeenCalledWith("aes-256-gcm", testKeyBuffer, testIv);
    });

    test("returns empty object for empty file", async () => {
      process.env.OTPLIBX_ENCRYPTION_KEY = testKey;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue("");

      const result = await nativeAesStorage.load(".env.otplibx");

      expect(result).toEqual({});
    });

    test("returns unencrypted values as-is", async () => {
      process.env.OTPLIBX_ENCRYPTION_KEY = testKey;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue("KEY=plaintext");

      const result = await nativeAesStorage.load(".env.otplibx");

      expect(result.KEY).toBe("plaintext");
    });
  });

  describe("set", () => {
    test("throws when file does not exist", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(nativeAesStorage.set(".env.otplibx", "KEY", "value")).rejects.toThrow(
        OtplibxStorageError,
      );
    });

    test("encrypts and writes value", async () => {
      process.env.OTPLIBX_ENCRYPTION_KEY = testKey;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue("");
      vi.mocked(crypto.randomBytes).mockReturnValue(testIv as unknown as void);

      const mockCipher = {
        update: vi.fn().mockReturnValue(Buffer.from("encrypted")),
        final: vi.fn().mockReturnValue(Buffer.alloc(0)),
        getAuthTag: vi.fn().mockReturnValue(testAuthTag),
      };
      vi.mocked(crypto.createCipheriv).mockReturnValue(mockCipher as unknown as crypto.CipherGCM);

      await nativeAesStorage.set(".env.otplibx", "KEY", "value");

      expect(crypto.createCipheriv).toHaveBeenCalledWith("aes-256-gcm", testKeyBuffer, testIv);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        ".env.otplibx",
        expect.stringMatching(/KEY=.*encrypted:/),
        { mode: 0o600 },
      );
    });

    test("removes key when value is empty", async () => {
      process.env.OTPLIBX_ENCRYPTION_KEY = testKey;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue("KEY=encrypted:abc123");

      await nativeAesStorage.set(".env.otplibx", "KEY", "");

      expect(fs.writeFileSync).toHaveBeenCalledWith(".env.otplibx", "", { mode: 0o600 });
    });
  });

  describe("remove", () => {
    test("throws when file does not exist", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(nativeAesStorage.remove(".env.otplibx", "KEY")).rejects.toThrow(
        OtplibxStorageError,
      );
    });

    test("removes key from file", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue("KEY1=value1\nKEY2=value2");

      await nativeAesStorage.remove(".env.otplibx", "KEY1");

      expect(fs.writeFileSync).toHaveBeenCalledWith(".env.otplibx", "KEY2=value2", { mode: 0o600 });
    });
  });

  describe("key validation", () => {
    test("throws on invalid key format", async () => {
      process.env.OTPLIBX_ENCRYPTION_KEY = "invalid";
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue("KEY=value");

      try {
        await nativeAesStorage.load(".env.otplibx");
      } catch (err) {
        expect(err).toBeInstanceOf(OtplibxStorageError);
        expect((err as OtplibxStorageError).code).toBe(ErrorCodes.INVALID_KEY);
      }
    });

    test("throws on short key", async () => {
      process.env.OTPLIBX_ENCRYPTION_KEY = "abc123";
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue("KEY=value");

      try {
        await nativeAesStorage.load(".env.otplibx");
      } catch (err) {
        expect(err).toBeInstanceOf(OtplibxStorageError);
        expect((err as OtplibxStorageError).code).toBe(ErrorCodes.INVALID_KEY);
      }
    });
  });

  describe("decryption errors", () => {
    test("throws on truncated encrypted value", async () => {
      process.env.OTPLIBX_ENCRYPTION_KEY = testKey;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      // Less than IV_LENGTH + AUTH_TAG_LENGTH bytes
      vi.mocked(fs.readFileSync).mockReturnValue(
        `KEY=encrypted:${Buffer.alloc(10).toString("base64")}`,
      );

      try {
        await nativeAesStorage.load(".env.otplibx");
      } catch (err) {
        expect(err).toBeInstanceOf(OtplibxStorageError);
        expect((err as OtplibxStorageError).code).toBe(ErrorCodes.DECRYPT_FAILED);
      }
    });

    test("throws on decryption failure", async () => {
      process.env.OTPLIBX_ENCRYPTION_KEY = testKey;
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const encryptedPayload = Buffer.concat([testIv, testAuthTag, Buffer.from("encrypted")]);
      vi.mocked(fs.readFileSync).mockReturnValue(
        `KEY=encrypted:${encryptedPayload.toString("base64")}`,
      );

      const mockDecipher = {
        update: vi.fn().mockReturnValue(Buffer.from("")),
        final: vi.fn().mockImplementation(() => {
          throw new Error("Unsupported state or unable to authenticate data");
        }),
        setAuthTag: vi.fn(),
      };
      vi.mocked(crypto.createDecipheriv).mockReturnValue(
        mockDecipher as unknown as crypto.DecipherGCM,
      );

      try {
        await nativeAesStorage.load(".env.otplibx");
      } catch (err) {
        expect(err).toBeInstanceOf(OtplibxStorageError);
        expect((err as OtplibxStorageError).code).toBe(ErrorCodes.DECRYPT_FAILED);
      }
    });

    test("throws on invalid base64 in encrypted value", async () => {
      process.env.OTPLIBX_ENCRYPTION_KEY = testKey;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue("KEY=encrypted:somedata");

      // Mock Buffer.from to throw when decoding base64
      const originalBufferFrom = Buffer.from;
      const mockBufferFrom = vi.fn().mockImplementation((...args: unknown[]) => {
        const [data, encoding] = args;
        if (encoding === "base64" && data === "somedata") {
          throw new Error("Invalid base64");
        }
        // For hex decoding (key parsing), call original
        return originalBufferFrom.apply(Buffer, args as Parameters<typeof Buffer.from>);
      });
      vi.stubGlobal("Buffer", { ...Buffer, from: mockBufferFrom });

      try {
        await nativeAesStorage.load(".env.otplibx");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(OtplibxStorageError);
        expect((err as OtplibxStorageError).code).toBe(ErrorCodes.DECRYPT_FAILED);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe("key from file", () => {
    test("loads key from .env.keys file when env var not set", async () => {
      vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
        const pathStr = p.toString();
        return pathStr === ".env.otplibx" || pathStr === ".env.keys";
      });
      vi.mocked(fs.readFileSync).mockImplementation((p: fs.PathOrFileDescriptor) => {
        const pathStr = p.toString();
        if (pathStr === ".env.keys") {
          return `OTPLIBX_ENCRYPTION_KEY=${testKey}`;
        }
        return "KEY=plaintext";
      });

      const result = await nativeAesStorage.load(".env.otplibx");

      expect(result.KEY).toBe("plaintext");
    });

    test("throws when keys file exists but does not contain encryption key", async () => {
      vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
        const pathStr = p.toString();
        return pathStr === ".env.otplibx" || pathStr === ".env.keys";
      });
      vi.mocked(fs.readFileSync).mockImplementation((p: fs.PathOrFileDescriptor) => {
        const pathStr = p.toString();
        if (pathStr === ".env.keys") {
          return "OTHER_KEY=somevalue";
        }
        return "KEY=value";
      });

      try {
        await nativeAesStorage.load(".env.otplibx");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(OtplibxStorageError);
        expect((err as OtplibxStorageError).code).toBe(ErrorCodes.NOT_INITIALIZED);
      }
    });

    test("set uses key from .env.keys file when env var not set", async () => {
      vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
        const pathStr = p.toString();
        return pathStr === ".env.otplibx" || pathStr === ".env.keys";
      });
      vi.mocked(fs.readFileSync).mockImplementation((p: fs.PathOrFileDescriptor) => {
        const pathStr = p.toString();
        if (pathStr === ".env.keys") {
          return `OTPLIBX_ENCRYPTION_KEY=${testKey}`;
        }
        return "";
      });
      vi.mocked(crypto.randomBytes).mockReturnValue(testIv as unknown as void);

      const mockCipher = {
        update: vi.fn().mockReturnValue(Buffer.from("encrypted")),
        final: vi.fn().mockReturnValue(Buffer.alloc(0)),
        getAuthTag: vi.fn().mockReturnValue(testAuthTag),
      };
      vi.mocked(crypto.createCipheriv).mockReturnValue(mockCipher as unknown as crypto.CipherGCM);

      await nativeAesStorage.set(".env.otplibx", "KEY", "value");

      expect(crypto.createCipheriv).toHaveBeenCalledWith("aes-256-gcm", testKeyBuffer, testIv);
    });
  });

  describe("init with existing keys file", () => {
    test("appends to existing .env.keys file", async () => {
      vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
        const pathStr = p.toString();
        // .env.otplibx doesn't exist, but .env.keys does
        return pathStr === ".env.keys";
      });
      vi.mocked(fs.readFileSync).mockReturnValue("OTHER_KEY=somevalue");
      vi.mocked(crypto.randomBytes).mockReturnValue(Buffer.alloc(32, 0xab) as unknown as void);

      await nativeAesStorage.init(".env.otplibx");

      expect(fs.readFileSync).toHaveBeenCalledWith(".env.keys", "utf8");
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        ".env.keys",
        expect.stringContaining("OTHER_KEY=somevalue"),
        { mode: 0o600 },
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        ".env.keys",
        expect.stringContaining("OTPLIBX_ENCRYPTION_KEY="),
        { mode: 0o600 },
      );
    });
  });

  describe("set without key", () => {
    test("throws when no key is found", async () => {
      vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
        // Only env file exists, no keys file
        return p.toString() === ".env.otplibx";
      });

      try {
        await nativeAesStorage.set(".env.otplibx", "KEY", "value");
      } catch (err) {
        expect(err).toBeInstanceOf(OtplibxStorageError);
        expect((err as OtplibxStorageError).code).toBe(ErrorCodes.NOT_INITIALIZED);
      }
    });
  });
});
