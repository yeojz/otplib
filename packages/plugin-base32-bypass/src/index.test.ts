import { describe, it, expect } from "vitest";
import {
  BypassBase32Plugin,
  StringBypassPlugin,
  HexBypassPlugin,
  stringBypass,
  hexBypass,
} from "./index.js";

describe("BypassBase32Plugin", () => {
  it("should use custom encode function", () => {
    const plugin = new BypassBase32Plugin({
      encode: () => "custom-encoded",
      decode: () => new Uint8Array([1, 2, 3]),
    });
    expect(plugin.encode(new Uint8Array())).toBe("custom-encoded");
  });

  it("should use custom decode function", () => {
    const plugin = new BypassBase32Plugin({
      encode: () => "custom-encoded",
      decode: () => new Uint8Array([1, 2, 3]),
    });
    expect(plugin.decode("anything")).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("should have name 'bypass'", () => {
    const plugin = new BypassBase32Plugin({
      encode: () => "",
      decode: () => new Uint8Array(),
    });
    expect(plugin.name).toBe("bypass");
  });

  it("should ignore Base32EncodeOptions", () => {
    const plugin = new BypassBase32Plugin({
      encode: (data) => String(data.length),
      decode: () => new Uint8Array(),
    });
    expect(plugin.encode(new Uint8Array([1, 2, 3]), { padding: true })).toBe("3");
  });
});

describe("StringBypassPlugin", () => {
  const plugin = new StringBypassPlugin();

  it("should decode UTF-8 string to bytes", () => {
    const result = plugin.decode("hello");
    expect(result).toEqual(new Uint8Array([104, 101, 108, 108, 111]));
  });

  it("should encode bytes to UTF-8 string", () => {
    const result = plugin.encode(new Uint8Array([104, 101, 108, 108, 111]));
    expect(result).toBe("hello");
  });

  it("should handle unicode characters", () => {
    const decoded = plugin.decode("héllo");
    const encoded = plugin.encode(decoded);
    expect(encoded).toBe("héllo");
  });

  it("should handle empty string", () => {
    expect(plugin.decode("")).toEqual(new Uint8Array([]));
    expect(plugin.encode(new Uint8Array([]))).toBe("");
  });

  it("should have name 'string-bypass'", () => {
    expect(plugin.name).toBe("string-bypass");
  });
});

describe("HexBypassPlugin", () => {
  const plugin = new HexBypassPlugin();

  it("should decode hex string to bytes", () => {
    const result = plugin.decode("48656c6c6f");
    expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
  });

  it("should reject hex strings with 0x prefix", () => {
    expect(() => plugin.decode("0x48656c6c6f")).toThrow();
  });

  it("should encode bytes to hex string", () => {
    const result = plugin.encode(new Uint8Array([72, 101, 108, 108, 111]));
    expect(result).toBe("48656c6c6f");
  });

  it("should handle empty string", () => {
    expect(plugin.decode("")).toEqual(new Uint8Array([]));
    expect(plugin.encode(new Uint8Array([]))).toBe("");
  });

  it("should have name 'hex-bypass'", () => {
    expect(plugin.name).toBe("hex-bypass");
  });
});

describe("singleton instances", () => {
  it("should export frozen stringBypass instance", () => {
    expect(stringBypass).toBeDefined();
    expect(stringBypass.name).toBe("string-bypass");
    expect(Object.isFrozen(stringBypass)).toBe(true);
  });

  it("should export frozen hexBypass instance", () => {
    expect(hexBypass).toBeDefined();
    expect(hexBypass.name).toBe("hex-bypass");
    expect(Object.isFrozen(hexBypass)).toBe(true);
  });

  it("stringBypass should encode and decode correctly", () => {
    const data = new TextEncoder().encode("test");
    const encoded = stringBypass.encode(data);
    const decoded = stringBypass.decode(encoded);
    expect(decoded).toEqual(data);
  });

  it("hexBypass should encode and decode correctly", () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    const encoded = hexBypass.encode(data);
    const decoded = hexBypass.decode(encoded);
    expect(decoded).toEqual(data);
  });
});
