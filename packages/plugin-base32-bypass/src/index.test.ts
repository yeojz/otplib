import { describe, it, expect } from "vitest";
import { BypassBase32Plugin } from "./index.js";

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
