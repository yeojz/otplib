import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../storage/index.js", () => ({
  default: {
    status: vi.fn(),
    init: vi.fn(),
    load: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

import storage from "../storage/index.js";
import { add } from "./add.js";
import { guardRm, guardShow, guardUpdate } from "./guard.js";
import { updateCounter } from "./hotp.js";
import { init } from "./init.js";
import { list } from "./list.js";
import { token } from "./token.js";
import { type } from "./type.js";
import { verify } from "./verify.js";

const mockStorage = vi.mocked(storage);

// Helper to create base64-encoded payloads
function encodePayloadHelper(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

// Pre-encoded payloads for testing
const TOTP_PAYLOAD = encodePayloadHelper({
  data: {
    type: "totp",
    secret: "YNA3WOLVGZTOGOMLZ6QWD6VKIE======",
    issuer: "GitHub",
    account: "user",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  },
});
const HOTP_PAYLOAD = encodePayloadHelper({
  data: {
    type: "hotp",
    secret: "YNA3WOLVGZTOGOMLZ6QWD6VKIE======",
    issuer: "Service",
    account: "user",
    algorithm: "SHA1",
    digits: 6,
    counter: 0,
  },
});

describe("otplibx commands", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("init", () => {
    test("creates new encrypted file", async () => {
      mockStorage.init.mockResolvedValue(undefined);

      await init({ file: ".env.test" });

      expect(mockStorage.init).toHaveBeenCalledWith(".env.test");
      expect(consoleLogSpy).toHaveBeenCalledWith("Initialized: .env.test");
    });

    test("throws if storage init fails", async () => {
      mockStorage.init.mockRejectedValue(new Error("already exists"));

      await expect(init({ file: ".env.test" })).rejects.toThrow("already exists");
    });
  });

  describe("add", () => {
    test("adds entry via storage.set", async () => {
      mockStorage.set.mockResolvedValue(undefined);

      const result = await add("otpauth://totp/Test?secret=YNA3WOLVGZTOGOMLZ6QWD6VKIE======", {
        file: ".env.test",
      });

      expect(mockStorage.set).toHaveBeenCalledWith(
        ".env.test",
        expect.stringMatching(/^[A-Z0-9]{9}$/),
        expect.any(String),
      );
      expect(result).toMatch(/^[A-Z0-9]{9}$/);
    });

    test("throws if input is empty", async () => {
      await expect(add("", { file: ".env.test" })).rejects.toThrow(
        "expected otpauth URI or JSON from stdin",
      );
    });

    test("adds entry with custom bytes option", async () => {
      mockStorage.set.mockResolvedValue(undefined);

      const result = await add("otpauth://totp/Test?secret=YNA3WOLVGZTOGOMLZ6QWD6VKIE======", {
        file: ".env.test",
        bytes: 8,
      });

      // With 8 bytes entropy, expect longer ID
      expect(result).toMatch(/^[A-Z0-9]+$/);
      expect(result.length).toBeGreaterThan(9);
    });
  });

  describe("token", () => {
    test("generates token for entry", async () => {
      mockStorage.load.mockResolvedValue({ AABCDEF12: TOTP_PAYLOAD });

      const result = await token("AABCDEF12", { file: ".env.test" });

      expect(mockStorage.load).toHaveBeenCalledWith(".env.test");
      expect(result).toMatch(/^\d{6}$/);
    });

    test("throws if id is missing", async () => {
      await expect(token("", { file: ".env.test" })).rejects.toThrow(
        "missing required argument: <id>",
      );
    });

    test("throws if entry not found", async () => {
      mockStorage.load.mockResolvedValue({});

      await expect(token("NOTFOUND", { file: ".env.test" })).rejects.toThrow(
        "entry not found: NOTFOUND",
      );
    });
  });

  describe("type", () => {
    test("returns type for totp entry", async () => {
      mockStorage.load.mockResolvedValue({ AABCDEF12: TOTP_PAYLOAD });

      const result = await type("AABCDEF12", { file: ".env.test" });

      expect(result).toBe("totp");
    });

    test("returns type for hotp entry", async () => {
      mockStorage.load.mockResolvedValue({ AABCDEF12: HOTP_PAYLOAD });

      const result = await type("AABCDEF12", { file: ".env.test" });

      expect(result).toBe("hotp");
    });

    test("throws if id is missing", async () => {
      await expect(type("", { file: ".env.test" })).rejects.toThrow(
        "missing required argument: <id>",
      );
    });

    test("throws if entry not found", async () => {
      mockStorage.load.mockResolvedValue({});

      await expect(type("NOTFOUND", { file: ".env.test" })).rejects.toThrow(
        "entry not found: NOTFOUND",
      );
    });
  });

  describe("list", () => {
    test("lists entries", async () => {
      mockStorage.load.mockResolvedValue({ AABCDEF12: TOTP_PAYLOAD });

      const result = await list({ file: ".env.test" });

      expect(mockStorage.load).toHaveBeenCalledWith(".env.test");
      expect(result).toContain("GitHub:user");
      expect(result).toContain("AABCDEF12");
      expect(result).toContain("totp");
    });

    test("returns message for empty entries", async () => {
      mockStorage.load.mockResolvedValue({});

      const result = await list({ file: ".env.test" });

      expect(result).toBe("No entries");
    });

    test("filters entries by label", async () => {
      mockStorage.load.mockResolvedValue({
        AABCDEF12: TOTP_PAYLOAD,
        BBBBBBB12: encodePayloadHelper({
          data: {
            type: "totp",
            secret: "YNA3WOLVGZTOGOMLZ6QWD6VKIE======",
            issuer: "Slack",
            account: "user",
            algorithm: "SHA1",
            digits: 6,
            period: 30,
          },
        }),
      });

      const result = await list({ file: ".env.test", filter: "github" });

      expect(result).toContain("GitHub:user");
      expect(result).not.toContain("Slack");
    });

    test("returns message when no matches for filter", async () => {
      mockStorage.load.mockResolvedValue({ AABCDEF12: TOTP_PAYLOAD });

      const result = await list({ file: ".env.test", filter: "nomatch" });

      expect(result).toBe("No matches");
    });
  });

  describe("updateCounter", () => {
    test("updates hotp counter", async () => {
      mockStorage.load.mockResolvedValue({ AABCDEF12: HOTP_PAYLOAD });
      mockStorage.set.mockResolvedValue(undefined);

      const result = await updateCounter("AABCDEF12", { file: ".env.test" });

      expect(mockStorage.load).toHaveBeenCalledWith(".env.test");
      expect(mockStorage.set).toHaveBeenCalledWith(".env.test", "AABCDEF12", expect.any(String));
      expect(result).toBe("AABCDEF12");
    });

    test("updates counter to specific value", async () => {
      mockStorage.load.mockResolvedValue({ AABCDEF12: HOTP_PAYLOAD });
      mockStorage.set.mockResolvedValue(undefined);

      const result = await updateCounter("AABCDEF12", { file: ".env.test", counter: 10 });

      expect(result).toBe("AABCDEF12");
      // Verify the encoded payload contains counter: 10
      const setCall = mockStorage.set.mock.calls[0];
      const encoded = setCall[2];
      const decoded = JSON.parse(Buffer.from(encoded, "base64").toString());
      expect(decoded.data.counter).toBe(10);
    });

    test("throws if id is missing", async () => {
      await expect(updateCounter("", { file: ".env.test" })).rejects.toThrow(
        "missing required argument: <id>",
      );
    });

    test("throws if entry not found", async () => {
      mockStorage.load.mockResolvedValue({});

      await expect(updateCounter("NOTFOUND", { file: ".env.test" })).rejects.toThrow(
        "entry not found: NOTFOUND",
      );
    });

    test("throws if entry is not HOTP", async () => {
      mockStorage.load.mockResolvedValue({ AABCDEF12: TOTP_PAYLOAD });

      await expect(updateCounter("AABCDEF12", { file: ".env.test" })).rejects.toThrow(
        "Entry AABCDEF12 is TOTP, not HOTP",
      );
    });
  });

  describe("verify", () => {
    test("returns true for valid token", async () => {
      mockStorage.load.mockResolvedValue({ AABCDEF12: TOTP_PAYLOAD });

      // Generate a valid token
      const { generateOtp } = await import("../../shared/otp.js");
      const validToken = await generateOtp(
        {
          type: "totp",
          secret: "YNA3WOLVGZTOGOMLZ6QWD6VKIE======",
          algorithm: "SHA1",
          digits: 6,
          period: 30,
        },
        {},
      );

      const result = await verify("AABCDEF12", validToken, { file: ".env.test" });

      expect(result).toBe(true);
    });

    test("returns false for invalid token", async () => {
      mockStorage.load.mockResolvedValue({ AABCDEF12: TOTP_PAYLOAD });

      const result = await verify("AABCDEF12", "000000", { file: ".env.test" });

      expect(result).toBe(false);
    });

    test("throws if id is missing", async () => {
      await expect(verify("", "123456", { file: ".env.test" })).rejects.toThrow(
        "missing required argument: <id>",
      );
    });

    test("throws if token is missing", async () => {
      await expect(verify("AABCDEF12", "", { file: ".env.test" })).rejects.toThrow(
        "missing required argument: <token>",
      );
    });

    test("throws if entry not found", async () => {
      mockStorage.load.mockResolvedValue({});

      await expect(verify("NOTFOUND", "123456", { file: ".env.test" })).rejects.toThrow(
        "entry not found: NOTFOUND",
      );
    });
  });

  describe("guardUpdate", () => {
    test("updates guardrail value", async () => {
      mockStorage.set.mockResolvedValue(undefined);

      const result = await guardUpdate("MIN_SECRET_BYTES", "8", { file: ".env.test" });

      expect(mockStorage.set).toHaveBeenCalledWith(".env.test", "OTPLIB_MIN_SECRET_BYTES", "8");
      expect(result).toBe("OTPLIB_MIN_SECRET_BYTES=8");
    });

    test("accepts key with OTPLIB_ prefix", async () => {
      mockStorage.set.mockResolvedValue(undefined);

      const result = await guardUpdate("OTPLIB_MAX_PERIOD", "7200", { file: ".env.test" });

      expect(mockStorage.set).toHaveBeenCalledWith(".env.test", "OTPLIB_MAX_PERIOD", "7200");
      expect(result).toBe("OTPLIB_MAX_PERIOD=7200");
    });

    test("throws for invalid guardrail key", async () => {
      await expect(guardUpdate("INVALID_KEY", "10", { file: ".env.test" })).rejects.toThrow(
        "invalid guardrail key: INVALID_KEY",
      );
    });

    test("throws for non-positive value", async () => {
      await expect(guardUpdate("MIN_SECRET_BYTES", "0", { file: ".env.test" })).rejects.toThrow(
        "value must be a positive integer",
      );
    });

    test("throws for non-integer value", async () => {
      await expect(guardUpdate("MIN_SECRET_BYTES", "abc", { file: ".env.test" })).rejects.toThrow(
        "value must be a positive integer",
      );
    });

    test("throws for missing key", async () => {
      await expect(guardUpdate("", "10", { file: ".env.test" })).rejects.toThrow(
        "missing required argument: <key>",
      );
    });

    test("throws for missing value", async () => {
      await expect(guardUpdate("MIN_SECRET_BYTES", "", { file: ".env.test" })).rejects.toThrow(
        "missing required argument: <value>",
      );
    });
  });

  describe("guardRm", () => {
    test("removes guardrail", async () => {
      mockStorage.remove.mockResolvedValue(undefined);

      const result = await guardRm("MIN_SECRET_BYTES", { file: ".env.test" });

      expect(mockStorage.remove).toHaveBeenCalledWith(".env.test", "OTPLIB_MIN_SECRET_BYTES");
      expect(result).toBe("Removed: OTPLIB_MIN_SECRET_BYTES");
    });

    test("throws for missing key", async () => {
      await expect(guardRm("", { file: ".env.test" })).rejects.toThrow(
        "missing required argument: <key>",
      );
    });

    test("throws for invalid guardrail key", async () => {
      await expect(guardRm("INVALID_KEY", { file: ".env.test" })).rejects.toThrow(
        "invalid guardrail key: INVALID_KEY",
      );
    });
  });

  describe("guardShow", () => {
    test("shows guardrail configuration", async () => {
      mockStorage.load.mockResolvedValue({ OTPLIB_MIN_SECRET_BYTES: "8" });

      const result = await guardShow({ file: ".env.test" });

      expect(mockStorage.load).toHaveBeenCalledWith(".env.test");
      expect(result).toContain("MIN_SECRET_BYTES");
    });

    test("returns table with defaults when no configured values", async () => {
      mockStorage.load.mockResolvedValue({});

      const result = await guardShow({ file: ".env.test" });

      // Should still show the guardrails table with defaults
      expect(result).toBeDefined();
    });
  });
});
