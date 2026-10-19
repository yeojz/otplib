import { describe, it, expect } from "vitest";
import { Rfc4648Base32Plugin } from "./index.js";

// RFC 4648 Section 10 test vectors
const RFC4648_VECTORS = [
  { input: "", encoded: "" },
  { input: "f", encoded: "MY======" },
  { input: "fo", encoded: "MZXQ====" },
  { input: "foo", encoded: "MZXW6===" },
  { input: "foob", encoded: "MZXW6YQ=" },
  { input: "fooba", encoded: "MZXW6YTB" },
  { input: "foobar", encoded: "MZXW6YTBOI======" },
];

describe("Rfc4648Base32Plugin", () => {
  const plugin = new Rfc4648Base32Plugin();

  describe("RFC 4648 test vectors", () => {
    it.each(RFC4648_VECTORS)("should encode $input as $encoded", ({ input, encoded }) => {
      expect(plugin.encode(new TextEncoder().encode(input), { padding: true })).toBe(encoded);
    });

    it.each(RFC4648_VECTORS)("should decode $encoded as $input", ({ input, encoded }) => {
      expect(new TextDecoder().decode(plugin.decode(encoded))).toBe(input);
    });
  });

  describe("encode", () => {
    it("should encode 'foobar' to Base32 with padding", () => {
      const data = new TextEncoder().encode("foobar");
      const encoded = plugin.encode(data, { padding: true });
      expect(encoded).toBe("MZXW6YTBOI======");
    });

    it("should encode 'foobar' to Base32 without padding", () => {
      const data = new TextEncoder().encode("foobar");
      const encoded = plugin.encode(data, { padding: false });
      expect(encoded).toBe("MZXW6YTBOI");
    });

    it("should default to no padding", () => {
      const data = new TextEncoder().encode("foobar");
      const encoded = plugin.encode(data);
      expect(encoded).toBe("MZXW6YTBOI");
    });

    it("should encode empty array", () => {
      const data = new Uint8Array([]);
      const encoded = plugin.encode(data);
      expect(encoded).toBe("");
    });

    it("should encode single byte", () => {
      const data = new Uint8Array([0x61]); // 'a'
      const encoded = plugin.encode(data);
      expect(encoded).toBe("ME");
    });

    it("should encode random bytes", () => {
      const data = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
      const encoded = plugin.encode(data);
      expect(encoded).toBe("AAAQEAYE");
    });

    it("should encode every byte value", () => {
      const data = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff]);
      expect(plugin.encode(data)).toBe("77777777");
    });
  });

  describe("decode", () => {
    it("should decode Base32 with padding", () => {
      const encoded = "MZXW6YTBOI======";
      const decoded = plugin.decode(encoded);
      expect(new TextDecoder().decode(decoded)).toBe("foobar");
    });

    it("should decode Base32 without padding", () => {
      const encoded = "MZXW6YTBOI";
      const decoded = plugin.decode(encoded);
      expect(new TextDecoder().decode(decoded)).toBe("foobar");
    });

    it("should decode lowercase input", () => {
      const encoded = "mzxw6ytboi";
      const decoded = plugin.decode(encoded);
      expect(new TextDecoder().decode(decoded)).toBe("foobar");
    });

    it("should decode mixed case input", () => {
      const encoded = "MzxW6YtBoI";
      const decoded = plugin.decode(encoded);
      expect(new TextDecoder().decode(decoded)).toBe("foobar");
    });

    it("should decode empty string", () => {
      const encoded = "";
      const decoded = plugin.decode(encoded);
      expect(decoded.length).toBe(0);
    });

    it("should decode partial padding", () => {
      expect(plugin.decode("ME=")).toEqual(new Uint8Array([0x61]));
    });

    it("should throw on invalid character", () => {
      const encoded = "MZXW6YTBOI1"; // '1' is invalid
      expect(() => plugin.decode(encoded)).toThrow("Invalid Base32");
    });

    it("should decode random bytes", () => {
      const data = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
      const encoded = plugin.encode(data);
      const decoded = plugin.decode(encoded);
      expect(decoded).toEqual(data);
    });

    // Same inputs and messages as ScureBase32Plugin, so either plugin rejects the same secrets.
    it.each([
      { input: "MF", message: "Non-zero padding: 64" },
      { input: "M", message: "Excess padding" },
      { input: "MEA", message: "Excess padding" },
      { input: "MEAAAA", message: "Excess padding" },
      { input: "M=======", message: "Excess padding" },
      { input: "=", message: "padding: excess padding" },
      { input: "MZXW6YTB========", message: "padding: excess padding" },
      { input: "ME=A", message: 'Unknown letter "=". Allowed: ABCDEFGHIJKLMNOPQRSTUVWXYZ234567' },
      {
        input: "JBSW Y3DP",
        message: 'Unknown letter " ". Allowed: ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
      },
      {
        input: "JBSW-Y3DP",
        message: 'Unknown letter "-". Allowed: ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
      },
      { input: "0189", message: 'Unknown letter "0". Allowed: ABCDEFGHIJKLMNOPQRSTUVWXYZ234567' },
      { input: "MEé", message: 'Unknown letter "É". Allowed: ABCDEFGHIJKLMNOPQRSTUVWXYZ234567' },
    ])("should reject $input", ({ input, message }) => {
      expect(() => plugin.decode(input)).toThrow(`Invalid Base32 string: ${message}`);
    });
  });

  describe("round-trip", () => {
    it("should encode and decode correctly", () => {
      const original = new TextEncoder().encode("Hello, World!");
      const encoded = plugin.encode(original);
      const decoded = plugin.decode(encoded);
      expect(decoded).toEqual(original);
    });

    it("should handle random bytes", () => {
      const randomData = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]);
      const encoded = plugin.encode(randomData);
      const decoded = plugin.decode(encoded);
      expect(decoded).toEqual(randomData);
    });

    it("should handle 20-byte secret", () => {
      const secret = new Uint8Array([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e,
        0x0f, 0x10, 0x11, 0x12, 0x13,
      ]);
      const encoded = plugin.encode(secret);
      const decoded = plugin.decode(encoded);
      expect(decoded).toEqual(secret);
    });
  });

  describe("plugin name", () => {
    it("should have name 'rfc4648'", () => {
      expect(plugin.name).toBe("rfc4648");
    });
  });
});

describe("base32 singleton", () => {
  it("should be a frozen singleton instance", async () => {
    const { base32 } = await import("./index");
    expect(base32).toBeDefined();
    expect(base32.name).toBe("rfc4648");
    expect(Object.isFrozen(base32)).toBe(true);
  });

  it("should encode and decode correctly", async () => {
    const { base32 } = await import("./index");
    const data = new TextEncoder().encode("test");
    const encoded = base32.encode(data);
    const decoded = base32.decode(encoded);
    expect(decoded).toEqual(data);
  });
});
