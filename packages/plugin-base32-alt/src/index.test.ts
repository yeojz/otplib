import { describe, it, expect } from "vitest";
import { Base32DecodeError } from "@otplib/core";
import {
  bypassAsString,
  bypassAsHex,
  bypassAsBase16,
  bypassAsBase64,
  createBase32Plugin,
} from "./index.js";

describe("bypassAsString", () => {
  it("should decode UTF-8 string to bytes", () => {
    const result = bypassAsString.decode("hello");
    expect(result).toEqual(new Uint8Array([104, 101, 108, 108, 111]));
  });

  it("should encode bytes to UTF-8 string", () => {
    const result = bypassAsString.encode(new Uint8Array([104, 101, 108, 108, 111]));
    expect(result).toBe("hello");
  });

  it("should handle unicode characters", () => {
    const decoded = bypassAsString.decode("héllo");
    const encoded = bypassAsString.encode(decoded);
    expect(encoded).toBe("héllo");
  });

  it("should handle empty string", () => {
    expect(bypassAsString.decode("")).toEqual(new Uint8Array([]));
    expect(bypassAsString.encode(new Uint8Array([]))).toBe("");
  });

  it("should have name 'bypass-as-string'", () => {
    expect(bypassAsString.name).toBe("bypass-as-string");
  });

  it("should be frozen", () => {
    expect(Object.isFrozen(bypassAsString)).toBe(true);
  });

  it("should roundtrip correctly", () => {
    const data = new TextEncoder().encode("test");
    const encoded = bypassAsString.encode(data);
    const decoded = bypassAsString.decode(encoded);
    expect(decoded).toEqual(data);
  });
});

describe("bypassAsHex", () => {
  it("should decode hex string to bytes", () => {
    const result = bypassAsHex.decode("48656c6c6f");
    expect(result).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
  });

  it("should encode bytes to hex string", () => {
    const result = bypassAsHex.encode(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
    expect(result).toBe("48656c6c6f");
  });

  it("should handle uppercase hex input", () => {
    const result = bypassAsHex.decode("48656C6C6F");
    expect(result).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
  });

  it("should handle mixed case hex input", () => {
    const result = bypassAsHex.decode("48656c6C6F");
    expect(result).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
  });

  it("should handle empty string", () => {
    expect(bypassAsHex.decode("")).toEqual(new Uint8Array([]));
    expect(bypassAsHex.encode(new Uint8Array([]))).toBe("");
  });

  it("should handle single byte", () => {
    expect(bypassAsHex.decode("ff")).toEqual(new Uint8Array([255]));
    expect(bypassAsHex.encode(new Uint8Array([255]))).toBe("ff");
  });

  it("should handle zero bytes", () => {
    expect(bypassAsHex.decode("00")).toEqual(new Uint8Array([0]));
    expect(bypassAsHex.encode(new Uint8Array([0]))).toBe("00");
  });

  it("should have name 'bypass-as-hex'", () => {
    expect(bypassAsHex.name).toBe("bypass-as-hex");
  });

  it("should be frozen", () => {
    expect(Object.isFrozen(bypassAsHex)).toBe(true);
  });

  it("should roundtrip correctly", () => {
    const data = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    const encoded = bypassAsHex.encode(data);
    const decoded = bypassAsHex.decode(encoded);
    expect(decoded).toEqual(data);
  });

  it("should produce lowercase hex output", () => {
    const result = bypassAsHex.encode(new Uint8Array([0xab, 0xcd, 0xef]));
    expect(result).toBe("abcdef");
  });

  it("should throw Base32DecodeError for odd-length hex string", () => {
    expect(() => bypassAsHex.decode("abc")).toThrow(Base32DecodeError);
    expect(() => bypassAsHex.decode("abc")).toThrow(
      /Hex string must have an even number of characters/,
    );
  });

  it("should throw Base32DecodeError for invalid hex characters", () => {
    expect(() => bypassAsHex.decode("ghij")).toThrow(Base32DecodeError);
    expect(() => bypassAsHex.decode("ghij")).toThrow(/Hex string contains invalid characters/);
  });

  it("should throw Base32DecodeError for mixed valid/invalid hex characters", () => {
    expect(() => bypassAsHex.decode("abzz")).toThrow(Base32DecodeError);
  });
});

describe("bypassAsBase16", () => {
  it("should be an alias for bypassAsHex", () => {
    expect(bypassAsBase16).toBe(bypassAsHex);
  });

  it("should have the same name as bypassAsHex", () => {
    expect(bypassAsBase16.name).toBe("bypass-as-hex");
  });
});

describe("bypassAsBase64", () => {
  it("should decode base64 string to bytes", () => {
    const result = bypassAsBase64.decode("SGVsbG8=");
    expect(result).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
  });

  it("should encode bytes to base64 string", () => {
    const result = bypassAsBase64.encode(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
    expect(result).toBe("SGVsbG8=");
  });

  it("should handle empty string", () => {
    expect(bypassAsBase64.decode("")).toEqual(new Uint8Array([]));
    expect(bypassAsBase64.encode(new Uint8Array([]))).toBe("");
  });

  it("should handle padding correctly", () => {
    expect(bypassAsBase64.decode("YQ==")).toEqual(new Uint8Array([0x61]));
    expect(bypassAsBase64.decode("YWI=")).toEqual(new Uint8Array([0x61, 0x62]));
    expect(bypassAsBase64.decode("YWJj")).toEqual(new Uint8Array([0x61, 0x62, 0x63]));
  });

  it("should have name 'bypass-as-base64'", () => {
    expect(bypassAsBase64.name).toBe("bypass-as-base64");
  });

  it("should be frozen", () => {
    expect(Object.isFrozen(bypassAsBase64)).toBe(true);
  });

  it("should roundtrip correctly", () => {
    const data = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    const encoded = bypassAsBase64.encode(data);
    const decoded = bypassAsBase64.decode(encoded);
    expect(decoded).toEqual(data);
  });

  it("should handle binary data with all byte values", () => {
    const data = new Uint8Array([0x00, 0x7f, 0x80, 0xff]);
    const encoded = bypassAsBase64.encode(data);
    const decoded = bypassAsBase64.decode(encoded);
    expect(decoded).toEqual(data);
  });

  it("should throw Base32DecodeError for invalid base64", () => {
    expect(() => bypassAsBase64.decode("!!!")).toThrow(Base32DecodeError);
  });
});

describe("createBase32Plugin re-export", () => {
  it("should re-export createBase32Plugin from @otplib/core", () => {
    expect(typeof createBase32Plugin).toBe("function");
  });

  it("should create working plugin", () => {
    const plugin = createBase32Plugin({
      name: "test",
      encode: () => "custom-encoded",
      decode: () => new Uint8Array([1, 2, 3]),
    });

    expect(plugin.name).toBe("test");
    expect(plugin.encode(new Uint8Array())).toBe("custom-encoded");
    expect(plugin.decode("anything")).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("should create frozen plugin", () => {
    const plugin = createBase32Plugin({
      encode: () => "",
      decode: () => new Uint8Array(),
    });

    expect(Object.isFrozen(plugin)).toBe(true);
  });
});
