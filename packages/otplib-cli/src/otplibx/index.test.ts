import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("./storage/index.js", () => ({
  default: {
    status: vi.fn(),
    init: vi.fn(),
    load: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

import storage from "./storage/index.js";
import { createOtplibxCli } from "./index.js";

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

function createMockReadStdin(data: string) {
  return vi.fn().mockResolvedValue(data);
}

function createEmptyReadStdin() {
  return vi.fn().mockResolvedValue("");
}

async function runCli(
  args: string[],
  readStdin: ReturnType<typeof createMockReadStdin>,
): Promise<{ exitCode: number }> {
  const originalExitCode = process.exitCode;
  process.exitCode = undefined;

  const program = createOtplibxCli(readStdin);
  await program.parseAsync(["node", "otplibx", ...args]);

  const exitCode = process.exitCode ?? 0;
  process.exitCode = originalExitCode;

  return { exitCode };
}

describe("otplibx CLI", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    stdoutWriteSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    stdoutWriteSpy.mockRestore();
  });

  describe("init command", () => {
    test("initializes new file successfully", async () => {
      mockStorage.init.mockResolvedValue(undefined);

      const { exitCode } = await runCli(["init", "test.env"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(mockStorage.init).toHaveBeenCalledWith("test.env");
      expect(consoleLogSpy).toHaveBeenCalledWith("Initialized: test.env");
    });

    test("uses default file when not specified", async () => {
      mockStorage.init.mockResolvedValue(undefined);

      const { exitCode } = await runCli(["init"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(mockStorage.init).toHaveBeenCalledWith(".env.otplibx");
    });

    test("respects -f option", async () => {
      mockStorage.init.mockResolvedValue(undefined);

      const { exitCode } = await runCli(["-f", "custom.env", "init"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(mockStorage.init).toHaveBeenCalledWith("custom.env");
    });

    test("fails when file exists", async () => {
      mockStorage.init.mockRejectedValue(new Error("File already exists: test.env"));

      const { exitCode } = await runCli(["init", "test.env"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: File already exists: test.env");
    });
  });

  describe("add command", () => {
    test("adds entry successfully", async () => {
      mockStorage.set.mockResolvedValue(undefined);

      const { exitCode } = await runCli(
        ["add"],
        createMockReadStdin("otpauth://totp/Test?secret=YNA3WOLVGZTOGOMLZ6QWD6VKIE======"),
      );

      expect(exitCode).toBe(0);
      expect(mockStorage.set).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test("fails with empty stdin", async () => {
      const { exitCode } = await runCli(["add"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "error: expected otpauth URI or JSON from stdin",
      );
    });

    test("rejects --bytes value less than 1", async () => {
      const { exitCode } = await runCli(
        ["add", "--bytes", "0"],
        createMockReadStdin("otpauth://totp/Test?secret=ABC"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: --bytes must be between 1 and 32");
    });

    test("rejects --bytes value greater than 32", async () => {
      const { exitCode } = await runCli(
        ["add", "--bytes", "33"],
        createMockReadStdin("otpauth://totp/Test?secret=ABC"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: --bytes must be between 1 and 32");
    });

    test("rejects non-numeric --bytes value", async () => {
      const { exitCode } = await runCli(
        ["add", "--bytes", "abc"],
        createMockReadStdin("otpauth://totp/Test?secret=ABC"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: --bytes must be between 1 and 32");
    });
  });

  describe("token command", () => {
    test("generates token with newline by default", async () => {
      mockStorage.load.mockResolvedValue({
        AABCDEF12: TOTP_PAYLOAD,
      });

      const { exitCode } = await runCli(["token", "AABCDEF12"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalled();
      const output = stdoutWriteSpy.mock.calls[0][0] as string;
      expect(output).toMatch(/^\d{6}\n$/);
    });

    test("generates token without newline when -n is provided", async () => {
      mockStorage.load.mockResolvedValue({
        AABCDEF12: TOTP_PAYLOAD,
      });

      const { exitCode } = await runCli(["token", "-n", "AABCDEF12"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalled();
      const output = stdoutWriteSpy.mock.calls[0][0] as string;
      expect(output).toMatch(/^\d{6}$/);
    });

    test("reads ID from stdin when no argument provided", async () => {
      mockStorage.load.mockResolvedValue({
        AABCDEF12: TOTP_PAYLOAD,
      });

      const { exitCode } = await runCli(["token"], createMockReadStdin("AABCDEF12\n"));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalled();
    });

    test("fails when no ID argument and stdin is empty", async () => {
      const { exitCode } = await runCli(["token"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: missing entry ID");
    });

    test("fails when entry not found", async () => {
      mockStorage.load.mockResolvedValue({});

      const { exitCode } = await runCli(["token", "NOTFOUND"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: entry not found: NOTFOUND");
    });
  });

  describe("type command", () => {
    test("outputs type with newline by default", async () => {
      mockStorage.load.mockResolvedValue({
        AABCDEF12: TOTP_PAYLOAD,
      });

      const { exitCode } = await runCli(["type", "AABCDEF12"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("totp\n");
    });

    test("outputs type without newline when -n is provided", async () => {
      mockStorage.load.mockResolvedValue({
        AABCDEF12: HOTP_PAYLOAD,
      });

      const { exitCode } = await runCli(["type", "-n", "AABCDEF12"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("hotp");
    });

    test("reads ID from stdin when no argument provided", async () => {
      mockStorage.load.mockResolvedValue({
        AABCDEF12: TOTP_PAYLOAD,
      });

      const { exitCode } = await runCli(["type"], createMockReadStdin("AABCDEF12\n"));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("totp\n");
    });

    test("fails when no ID argument and stdin is empty", async () => {
      const { exitCode } = await runCli(["type"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: missing entry ID");
    });

    test("fails when entry not found", async () => {
      mockStorage.load.mockResolvedValue({});

      const { exitCode } = await runCli(["type", "NOTFOUND"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: entry not found: NOTFOUND");
    });
  });

  describe("list command", () => {
    test("lists entries successfully", async () => {
      mockStorage.load.mockResolvedValue({
        AABCDEF12: TOTP_PAYLOAD,
      });

      const { exitCode } = await runCli(["list"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalled();
    });

    test("outputs 'No entries' when empty", async () => {
      mockStorage.load.mockResolvedValue({});

      const { exitCode } = await runCli(["list"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("No entries\n");
    });

    test("fails when load throws", async () => {
      mockStorage.load.mockRejectedValue(new Error("decrypt failed"));

      const { exitCode } = await runCli(["list"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: decrypt failed");
    });
  });

  describe("guard commands", () => {
    test("guard update sets guardrail value", async () => {
      mockStorage.set.mockResolvedValue(undefined);

      const { exitCode } = await runCli(
        ["guard", "update", "MIN_SECRET_BYTES", "8"],
        createEmptyReadStdin(),
      );

      expect(exitCode).toBe(0);
      expect(mockStorage.set).toHaveBeenCalledWith(".env.otplibx", "OTPLIB_MIN_SECRET_BYTES", "8");
      expect(consoleLogSpy).toHaveBeenCalledWith("OTPLIB_MIN_SECRET_BYTES=8");
    });

    test("guard rm removes guardrail", async () => {
      mockStorage.remove.mockResolvedValue(undefined);

      const { exitCode } = await runCli(
        ["guard", "rm", "MIN_SECRET_BYTES"],
        createEmptyReadStdin(),
      );

      expect(exitCode).toBe(0);
      expect(mockStorage.remove).toHaveBeenCalledWith(".env.otplibx", "OTPLIB_MIN_SECRET_BYTES");
      expect(consoleLogSpy).toHaveBeenCalledWith("Removed: OTPLIB_MIN_SECRET_BYTES");
    });

    test("guard show displays configuration", async () => {
      mockStorage.load.mockResolvedValue({
        OTPLIB_MIN_SECRET_BYTES: "8",
      });

      const { exitCode } = await runCli(["guard", "show"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test("guard show logs result even with no configured values", async () => {
      mockStorage.load.mockResolvedValue({});

      const { exitCode } = await runCli(["guard", "show"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test("guard show fails when load throws", async () => {
      mockStorage.load.mockRejectedValue(new Error("decrypt failed"));

      const { exitCode } = await runCli(["guard", "show"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: decrypt failed");
    });

    test("guard update fails with invalid key", async () => {
      const { exitCode } = await runCli(
        ["guard", "update", "INVALID_KEY", "8"],
        createEmptyReadStdin(),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("invalid guardrail key: INVALID_KEY"),
      );
    });

    test("guard rm fails with invalid key", async () => {
      const { exitCode } = await runCli(["guard", "rm", "INVALID_KEY"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("invalid guardrail key: INVALID_KEY"),
      );
    });
  });

  describe("hotp update-counter command", () => {
    test("updates counter successfully", async () => {
      mockStorage.load.mockResolvedValue({
        AABCDEF12: HOTP_PAYLOAD,
      });
      mockStorage.set.mockResolvedValue(undefined);

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "AABCDEF12"],
        createEmptyReadStdin(),
      );

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("AABCDEF12");
    });

    test("updates counter with specific value", async () => {
      mockStorage.load.mockResolvedValue({
        AABCDEF12: HOTP_PAYLOAD,
      });
      mockStorage.set.mockResolvedValue(undefined);

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "AABCDEF12", "10"],
        createEmptyReadStdin(),
      );

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("AABCDEF12");
    });

    test("fails with invalid counter value", async () => {
      const { exitCode } = await runCli(
        ["hotp", "update-counter", "AABCDEF12", "abc"],
        createEmptyReadStdin(),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: counter must be a non-negative integer");
    });

    test("fails with negative counter value", async () => {
      const { exitCode } = await runCli(
        ["hotp", "update-counter", "AABCDEF12", "-5"],
        createEmptyReadStdin(),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: counter must be a non-negative integer");
    });

    test("fails when entry not found", async () => {
      mockStorage.load.mockResolvedValue({});

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "NOTFOUND"],
        createEmptyReadStdin(),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: entry not found: NOTFOUND");
    });
  });

  describe("verify command", () => {
    test("exits with 0 when token is valid", async () => {
      mockStorage.load.mockResolvedValue({
        AABCDEF12: TOTP_PAYLOAD,
      });

      // We can't predict the exact token, so we generate it
      const { generateOtp } = await import("../shared/otp.js");
      const token = await generateOtp(
        {
          type: "totp",
          secret: "YNA3WOLVGZTOGOMLZ6QWD6VKIE======",
          algorithm: "SHA1",
          digits: 6,
          period: 30,
        },
        {},
      );

      const { exitCode } = await runCli(["verify", "AABCDEF12", token], createEmptyReadStdin());

      expect(exitCode).toBe(0);
    });

    test("exits with 1 when token is invalid", async () => {
      mockStorage.load.mockResolvedValue({
        AABCDEF12: TOTP_PAYLOAD,
      });

      const { exitCode } = await runCli(["verify", "AABCDEF12", "000000"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
    });

    test("fails when entry not found", async () => {
      mockStorage.load.mockResolvedValue({});

      const { exitCode } = await runCli(["verify", "NOTFOUND", "123456"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: entry not found: NOTFOUND");
    });
  });
});
