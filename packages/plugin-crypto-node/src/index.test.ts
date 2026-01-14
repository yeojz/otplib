import { describe, it, expect } from "vitest";
import { NodeCryptoPlugin } from "./index.js";
import { stringToBytes } from "@otplib/core";
import { testRFC4226HMAC } from "@repo/testing";

describe("NodeCryptoPlugin", () => {
  describe("randomBytes", () => {
    it("should generate random bytes of specified length", () => {
      const plugin = new NodeCryptoPlugin();
      const bytes = plugin.randomBytes(16);

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(16);
    });

    it("should generate different random bytes each time", () => {
      const plugin = new NodeCryptoPlugin();
      const bytes1 = plugin.randomBytes(16);
      const bytes2 = plugin.randomBytes(16);

      expect(bytes1).not.toEqual(bytes2);
    });

    it("should generate random bytes with entropy", () => {
      const plugin = new NodeCryptoPlugin();
      const bytes = plugin.randomBytes(32);

      // Check that bytes are not all zeros
      const allZeros = bytes.every((byte) => byte === 0);
      expect(allZeros).toBe(false);

      // Check that bytes are not all the same
      const firstByte = bytes[0];
      const allSame = bytes.every((byte) => byte === firstByte);
      expect(allSame).toBe(false);
    });
  });

  describe("hmac", () => {
    it("should compute HMAC-SHA1 correctly", async () => {
      const plugin = new NodeCryptoPlugin();
      const secret = stringToBytes("abcde");
      const message = stringToBytes("fghij");

      const result = await plugin.hmac("sha1", secret, message);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(20); // SHA1 outputs 20 bytes
    });

    it("should compute HMAC-SHA256 correctly", async () => {
      const plugin = new NodeCryptoPlugin();
      const secret = stringToBytes("abcde");
      const message = stringToBytes("fghij");

      const result = await plugin.hmac("sha256", secret, message);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32); // SHA256 outputs 32 bytes
    });

    it("should compute HMAC-SHA512 correctly", async () => {
      const plugin = new NodeCryptoPlugin();
      const secret = stringToBytes("abcde");
      const message = stringToBytes("fghij");

      const result = await plugin.hmac("sha512", secret, message);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(64); // SHA512 outputs 64 bytes
    });

    it("should produce consistent HMAC for same inputs", async () => {
      const plugin = new NodeCryptoPlugin();
      const secret = stringToBytes("abcde");
      const message = stringToBytes("fghij");

      const result1 = await plugin.hmac("sha1", secret, message);
      const result2 = await plugin.hmac("sha1", secret, message);

      expect(result1).toEqual(result2);
    });

    it("should produce different HMAC for different messages", async () => {
      const plugin = new NodeCryptoPlugin();
      const secret = stringToBytes("abcde");
      const message1 = stringToBytes("fghij");
      const message2 = stringToBytes("fghik");

      const result1 = await plugin.hmac("sha1", secret, message1);
      const result2 = await plugin.hmac("sha1", secret, message2);

      expect(result1).not.toEqual(result2);
    });

    it("should produce different HMAC for different secrets", async () => {
      const plugin = new NodeCryptoPlugin();
      const secret1 = stringToBytes("abcde");
      const secret2 = stringToBytes("abcdf");
      const message = stringToBytes("fghij");

      const result1 = await plugin.hmac("sha1", secret1, message);
      const result2 = await plugin.hmac("sha1", secret2, message);

      expect(result1).not.toEqual(result2);
    });

    it("should match RFC 4226 intermediate HMAC values", async () => {
      const plugin = new NodeCryptoPlugin();
      await testRFC4226HMAC(plugin, expect);
    });
  });

  describe("constantTimeEqual", () => {
    it("should return true for equal strings", () => {
      const plugin = new NodeCryptoPlugin();
      const result = plugin.constantTimeEqual("hello", "hello");

      expect(result).toBe(true);
    });

    it("should return false for different strings", () => {
      const plugin = new NodeCryptoPlugin();
      const result = plugin.constantTimeEqual("hello", "world");

      expect(result).toBe(false);
    });

    it("should return true for equal Uint8Arrays", () => {
      const plugin = new NodeCryptoPlugin();
      const arr1 = new Uint8Array([1, 2, 3, 4, 5]);
      const arr2 = new Uint8Array([1, 2, 3, 4, 5]);
      const result = plugin.constantTimeEqual(arr1, arr2);

      expect(result).toBe(true);
    });

    it("should return false for different Uint8Arrays", () => {
      const plugin = new NodeCryptoPlugin();
      const arr1 = new Uint8Array([1, 2, 3, 4, 5]);
      const arr2 = new Uint8Array([1, 2, 3, 4, 6]);
      const result = plugin.constantTimeEqual(arr1, arr2);

      expect(result).toBe(false);
    });

    it("should return false for different length arrays", () => {
      const plugin = new NodeCryptoPlugin();
      const arr1 = new Uint8Array([1, 2, 3]);
      const arr2 = new Uint8Array([1, 2, 3, 4]);
      const result = plugin.constantTimeEqual(arr1, arr2);

      expect(result).toBe(false);
    });

    it("should return false for different length strings", () => {
      const plugin = new NodeCryptoPlugin();
      const result = plugin.constantTimeEqual("hello", "hello world");

      expect(result).toBe(false);
    });

    it("should handle mixed string and Uint8Array inputs", () => {
      const plugin = new NodeCryptoPlugin();
      const str = "hello";
      const arr = stringToBytes("hello");
      const result = plugin.constantTimeEqual(str, arr);

      expect(result).toBe(true);
    });

    it("should return true for empty strings", () => {
      const plugin = new NodeCryptoPlugin();
      const result = plugin.constantTimeEqual("", "");

      expect(result).toBe(true);
    });

    it("should return true for empty Uint8Arrays", () => {
      const plugin = new NodeCryptoPlugin();
      const arr1 = new Uint8Array([]);
      const arr2 = new Uint8Array([]);
      const result = plugin.constantTimeEqual(arr1, arr2);

      expect(result).toBe(true);
    });
  });
});
