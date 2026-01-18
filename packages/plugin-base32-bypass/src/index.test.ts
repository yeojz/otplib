import { describe, it, expect } from "vitest";
import { stringBypass, createBase32Plugin } from "./index.js";

describe("stringBypass", () => {
  it("should decode UTF-8 string to bytes", () => {
    const result = stringBypass.decode("hello");
    expect(result).toEqual(new Uint8Array([104, 101, 108, 108, 111]));
  });

  it("should encode bytes to UTF-8 string", () => {
    const result = stringBypass.encode(new Uint8Array([104, 101, 108, 108, 111]));
    expect(result).toBe("hello");
  });

  it("should handle unicode characters", () => {
    const decoded = stringBypass.decode("héllo");
    const encoded = stringBypass.encode(decoded);
    expect(encoded).toBe("héllo");
  });

  it("should handle empty string", () => {
    expect(stringBypass.decode("")).toEqual(new Uint8Array([]));
    expect(stringBypass.encode(new Uint8Array([]))).toBe("");
  });

  it("should have name 'string-bypass'", () => {
    expect(stringBypass.name).toBe("string-bypass");
  });

  it("should be frozen", () => {
    expect(Object.isFrozen(stringBypass)).toBe(true);
  });

  it("should roundtrip correctly", () => {
    const data = new TextEncoder().encode("test");
    const encoded = stringBypass.encode(data);
    const decoded = stringBypass.decode(encoded);
    expect(decoded).toEqual(data);
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
