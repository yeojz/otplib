import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Readable } from "node:stream";

// Mock all dependencies before importing
vi.mock("node:fs", () => ({
  default: {
    openSync: vi.fn(),
    writeSync: vi.fn(),
    closeSync: vi.fn(),
  },
}));

vi.mock("../shared/otp.js", () => ({
  generateOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("../shared/parse.js", () => {
  const parseEnvInputMock = vi.fn();
  return {
    parseAddInput: vi.fn(),
    parseEnvInput: parseEnvInputMock,
    parseDotenvxInput: parseEnvInputMock,
    findEntry: vi.fn(),
    updateHotpCounter: vi.fn(),
  };
});

vi.mock("../shared/types.js", () => ({
  encodePayload: vi.fn(),
  formatOutput: vi.fn(),
  generateUid: vi.fn(),
  getLabel: vi.fn(),
}));

import fs from "node:fs";
import { generateOtp, verifyOtp } from "../shared/otp.js";
import { findEntry, parseAddInput, parseEnvInput, updateHotpCounter } from "../shared/parse.js";
import { createCli } from "./index.js";
import { encodePayload, formatOutput, generateUid, getLabel } from "../shared/types.js";

const mockFs = vi.mocked(fs);
const mockGenerateOtp = vi.mocked(generateOtp);
const mockVerifyOtp = vi.mocked(verifyOtp);
const mockParseAddInput = vi.mocked(parseAddInput);
const mockParseEnvInput = vi.mocked(parseEnvInput);
const mockFindEntry = vi.mocked(findEntry);
const mockUpdateHotpCounter = vi.mocked(updateHotpCounter);
const mockEncodePayload = vi.mocked(encodePayload);
const mockFormatOutput = vi.mocked(formatOutput);
const mockGenerateUid = vi.mocked(generateUid);
const mockGetLabel = vi.mocked(getLabel);

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

  const program = createCli(readStdin);
  await program.parseAsync(["node", "otplib", ...args]);

  const exitCode = process.exitCode ?? 0;
  process.exitCode = originalExitCode;

  return { exitCode };
}

describe("CLI", () => {
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

  describe("encode command", () => {
    test("outputs error when stdin is empty", async () => {
      const { exitCode } = await runCli(["encode"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error: Expected otpauth URI or JSON from stdin",
      );
    });

    test("parses input and outputs formatted entry", async () => {
      const mockData = { type: "totp", secret: "ABC", algorithm: "SHA1", digits: 6, period: 30 };
      mockParseAddInput.mockReturnValue(mockData as ReturnType<typeof parseAddInput>);
      mockGenerateUid.mockReturnValue("test-uid");
      mockEncodePayload.mockReturnValue("payload");

      const { exitCode } = await runCli(
        ["encode"],
        createMockReadStdin("otpauth://totp/Test?secret=ABC"),
      );

      expect(exitCode).toBe(0);
      expect(mockParseAddInput).toHaveBeenCalledWith("otpauth://totp/Test?secret=ABC");
      expect(stdoutWriteSpy).toHaveBeenCalledWith("TEST-UID=payload\n");
    });

    test("saves UID to file when --save-uid is provided", async () => {
      const mockData = { type: "totp", secret: "ABC", algorithm: "SHA1", digits: 6, period: 30 };
      mockParseAddInput.mockReturnValue(mockData as ReturnType<typeof parseAddInput>);
      mockGenerateUid.mockReturnValue("test-uid");
      mockEncodePayload.mockReturnValue("payload");
      mockFs.openSync.mockReturnValue(3);

      const { exitCode } = await runCli(
        ["encode", "--save-uid", "/tmp/uids.txt"],
        createMockReadStdin("otpauth://totp/Test?secret=ABC"),
      );

      expect(exitCode).toBe(0);
      expect(mockFs.openSync).toHaveBeenCalledWith("/tmp/uids.txt", "a", 0o600);
      expect(mockFs.writeSync).toHaveBeenCalledWith(3, "test-uid\n");
      expect(mockFs.closeSync).toHaveBeenCalledWith(3);
    });

    test("handles file save error gracefully", async () => {
      const mockData = { type: "totp", secret: "ABC", algorithm: "SHA1", digits: 6, period: 30 };
      mockParseAddInput.mockReturnValue(mockData as ReturnType<typeof parseAddInput>);
      mockGenerateUid.mockReturnValue("test-uid");
      mockEncodePayload.mockReturnValue("payload");
      mockFs.openSync.mockImplementation(() => {
        throw new Error("Permission denied");
      });

      const { exitCode } = await runCli(
        ["encode", "--save-uid", "/tmp/uids.txt"],
        createMockReadStdin("otpauth://totp/Test?secret=ABC"),
      );

      expect(exitCode).toBe(1);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("TEST-UID=payload\n");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Warning: Could not save UID"),
      );
    });

    test("handles parse error", async () => {
      mockParseAddInput.mockImplementation(() => {
        throw new Error("Invalid input");
      });

      const { exitCode } = await runCli(["encode"], createMockReadStdin("invalid"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Invalid input");
    });

    test("rejects --bytes value less than 1", async () => {
      const { exitCode } = await runCli(
        ["encode", "--bytes", "0"],
        createMockReadStdin("otpauth://totp/Test?secret=ABC"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: bytes must be between 1 and 32");
    });

    test("rejects --bytes value greater than 32", async () => {
      const { exitCode } = await runCli(
        ["encode", "--bytes", "33"],
        createMockReadStdin("otpauth://totp/Test?secret=ABC"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: bytes must be between 1 and 32");
    });

    test("rejects non-numeric --bytes value", async () => {
      const { exitCode } = await runCli(
        ["encode", "--bytes", "abc"],
        createMockReadStdin("otpauth://totp/Test?secret=ABC"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: --bytes must be between 1 and 32");
    });
  });

  describe("list command", () => {
    test("outputs error when stdin is empty", async () => {
      const { exitCode } = await runCli(["list"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Expected JSON from stdin");
    });

    test("outputs 'No entries' when list is empty", async () => {
      mockParseEnvInput.mockReturnValue({ entries: [] });

      const { exitCode } = await runCli(["list"], createMockReadStdin("{}"));

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("No entries");
    });

    test("outputs entries in label/id/type format", async () => {
      const entries = [
        { id: "id1", payload: { data: { type: "totp", secret: "A" } } },
        { id: "id2", payload: { data: { type: "hotp", secret: "B" } } },
      ];
      mockParseEnvInput.mockReturnValue({ entries } as ReturnType<typeof parseEnvInput>);
      mockGetLabel.mockImplementation((data) => (data as { secret: string }).secret);

      const { exitCode } = await runCli(["list"], createMockReadStdin('{"id1":"...","id2":"..."}'));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("A\tid1\ttotp\n");
      expect(stdoutWriteSpy).toHaveBeenCalledWith("B\tid2\thotp\n");
    });

    test("filters entries with --filter option", async () => {
      const entries = [
        { id: "id1", payload: { data: { type: "totp", secret: "A" } } },
        { id: "id2", payload: { data: { type: "hotp", secret: "B" } } },
      ];
      mockParseEnvInput.mockReturnValue({ entries } as ReturnType<typeof parseEnvInput>);
      mockGetLabel.mockReturnValue("GitHub:user");

      const { exitCode } = await runCli(
        ["list", "--filter", "id1"],
        createMockReadStdin('{"id1":"...","id2":"..."}'),
      );

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("GitHub:user\tid1\ttotp\n");
      expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
    });

    test("outputs 'No matches' when filter matches nothing", async () => {
      const entries = [{ id: "id1", payload: { data: { type: "totp", secret: "A" } } }];
      mockParseEnvInput.mockReturnValue({ entries } as ReturnType<typeof parseEnvInput>);
      mockGetLabel.mockReturnValue("GitHub:user");

      const { exitCode } = await runCli(
        ["list", "--filter", "xyz"],
        createMockReadStdin('{"id1":"..."}'),
      );

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("No matches");
    });

    test("handles parse error", async () => {
      mockParseEnvInput.mockImplementation(() => {
        throw new Error("Invalid JSON");
      });

      const { exitCode } = await runCli(["list"], createMockReadStdin("invalid"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Invalid JSON");
    });
  });

  describe("hotp update-counter command", () => {
    test("outputs error when stdin is empty", async () => {
      const { exitCode } = await runCli(
        ["hotp", "update-counter", "test-id"],
        createEmptyReadStdin(),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Expected JSON from stdin");
    });

    test("outputs error when entry not found", async () => {
      mockParseEnvInput.mockReturnValue({ entries: [] });
      mockFindEntry.mockReturnValue(undefined);

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "missing"],
        createMockReadStdin("{}"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: entry not found: missing");
    });

    test("outputs error when entry is TOTP", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "test"],
        createMockReadStdin("{}"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Entry test is TOTP, not HOTP");
    });

    test("increments counter by default", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 5 } } };
      const updatedData = { type: "hotp", secret: "ABC", counter: 6 };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockUpdateHotpCounter.mockReturnValue(updatedData as ReturnType<typeof updateHotpCounter>);
      mockFormatOutput.mockReturnValue("test=updated");

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "test"],
        createMockReadStdin("{}"),
      );

      expect(exitCode).toBe(0);
      expect(mockUpdateHotpCounter).toHaveBeenCalledWith(entry.payload.data, undefined);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("test=updated\n");
    });

    test("sets counter to specific value", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 5 } } };
      const updatedData = { type: "hotp", secret: "ABC", counter: 10 };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockUpdateHotpCounter.mockReturnValue(updatedData as ReturnType<typeof updateHotpCounter>);
      mockFormatOutput.mockReturnValue("test=updated");

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "test", "10"],
        createMockReadStdin("{}"),
      );

      expect(exitCode).toBe(0);
      expect(mockUpdateHotpCounter).toHaveBeenCalledWith(entry.payload.data, 10);
    });

    test("rejects invalid counter value", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 5 } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "test", "abc"],
        createMockReadStdin("{}"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Counter must be a non-negative integer");
    });

    test("rejects negative counter value", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 5 } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "test", "-1"],
        createMockReadStdin("{}"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Counter must be a non-negative integer");
    });

    test("handles update error", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 5 } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockUpdateHotpCounter.mockImplementation(() => {
        throw new Error("Update failed");
      });

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "test"],
        createMockReadStdin("{}"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Update failed");
    });
  });

  describe("verify command", () => {
    test("outputs error when stdin is empty", async () => {
      const { exitCode } = await runCli(["verify", "test-id", "123456"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Expected JSON from stdin");
    });

    test("outputs error when entry not found", async () => {
      mockParseEnvInput.mockReturnValue({ entries: [] });
      mockFindEntry.mockReturnValue(undefined);

      const { exitCode } = await runCli(["verify", "missing", "123456"], createMockReadStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: entry not found: missing");
    });

    test("exits with 0 when token is valid", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockVerifyOtp.mockResolvedValue(true);

      const { exitCode } = await runCli(["verify", "test", "123456"], createMockReadStdin("{}"));

      expect(exitCode).toBe(0);
      expect(mockVerifyOtp).toHaveBeenCalledWith(entry.payload.data, "123456", undefined);
    });

    test("exits with 1 when token is invalid", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockVerifyOtp.mockResolvedValue(false);

      const { exitCode } = await runCli(["verify", "test", "000000"], createMockReadStdin("{}"));

      expect(exitCode).toBe(1);
    });

    test("handles verification error", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockVerifyOtp.mockRejectedValue(new Error("Verification failed"));

      const { exitCode } = await runCli(["verify", "test", "123456"], createMockReadStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Verification failed");
    });
  });

  describe("token command (auto-detect)", () => {
    test("outputs error when stdin is empty", async () => {
      const { exitCode } = await runCli(["token", "test-id"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Expected JSON from stdin");
    });

    test("outputs error when entry not found", async () => {
      mockParseEnvInput.mockReturnValue({ entries: [] });
      mockFindEntry.mockReturnValue(undefined);

      const { exitCode } = await runCli(["token", "missing"], createMockReadStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: entry not found: missing");
    });

    test("generates TOTP token when entry type is totp", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockGenerateOtp.mockResolvedValue("123456");

      const { exitCode } = await runCli(["token", "test"], createMockReadStdin("{}"));

      expect(exitCode).toBe(0);
      expect(mockGenerateOtp).toHaveBeenCalledWith(entry.payload.data, undefined);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("123456\n");
    });

    test("generates HOTP token when entry type is hotp", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 0 } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockGenerateOtp.mockResolvedValue("654321");

      const { exitCode } = await runCli(["token", "test"], createMockReadStdin("{}"));

      expect(exitCode).toBe(0);
      expect(mockGenerateOtp).toHaveBeenCalledWith(entry.payload.data, undefined);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("654321\n");
    });

    test("outputs token without newline when -n flag is used", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockGenerateOtp.mockResolvedValue("123456");

      const { exitCode } = await runCli(["token", "-n", "test"], createMockReadStdin("{}"));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("123456");
    });

    test("passes guardrails to generateOtp", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      const guardrails = { MIN_SECRET_BYTES: 8 };
      mockParseEnvInput.mockReturnValue({
        entries: [entry],
        guardrails,
      } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockGenerateOtp.mockResolvedValue("123456");

      const { exitCode } = await runCli(["token", "test"], createMockReadStdin("{}"));

      expect(exitCode).toBe(0);
      expect(mockGenerateOtp).toHaveBeenCalledWith(entry.payload.data, guardrails);
    });

    test("handles generation error", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockGenerateOtp.mockRejectedValue(new Error("Generation failed"));

      const { exitCode } = await runCli(["token", "test"], createMockReadStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Generation failed");
    });
  });

  describe("type command", () => {
    test("outputs error when stdin is empty", async () => {
      const { exitCode } = await runCli(["type", "test-id"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Expected JSON from stdin");
    });

    test("outputs error when entry not found", async () => {
      mockParseEnvInput.mockReturnValue({ entries: [] });
      mockFindEntry.mockReturnValue(undefined);

      const { exitCode } = await runCli(["type", "missing"], createMockReadStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: entry not found: missing");
    });

    test("outputs 'totp' for TOTP entry", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);

      const { exitCode } = await runCli(["type", "test"], createMockReadStdin("{}"));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("totp\n");
    });

    test("outputs 'hotp' for HOTP entry", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 0 } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);

      const { exitCode } = await runCli(["type", "test"], createMockReadStdin("{}"));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("hotp\n");
    });

    test("outputs type without newline when -n flag is used", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseEnvInput.mockReturnValue({ entries: [entry] } as ReturnType<typeof parseEnvInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);

      const { exitCode } = await runCli(["type", "-n", "test"], createMockReadStdin("{}"));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("totp");
    });

    test("handles parse error", async () => {
      mockParseEnvInput.mockImplementation(() => {
        throw new Error("Invalid JSON");
      });

      const { exitCode } = await runCli(["type", "test"], createMockReadStdin("invalid"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Invalid JSON");
    });
  });

  describe("guard show command", () => {
    test("shows defaults when no guardrails configured", async () => {
      mockParseEnvInput.mockReturnValue({ entries: [] } as ReturnType<typeof parseEnvInput>);

      const { exitCode } = await runCli(["guard", "show"], createMockReadStdin("{}"));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("Guardrail"));
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("MIN_SECRET_BYTES"));
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("16"));
    });

    test("shows configured values alongside defaults", async () => {
      mockParseEnvInput.mockReturnValue({
        entries: [],
        guardrails: { MIN_SECRET_BYTES: 8 },
      } as ReturnType<typeof parseEnvInput>);

      const { exitCode } = await runCli(["guard", "show"], createMockReadStdin("{}"));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("8"));
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("16"));
    });

    test("shows defaults when stdin is empty", async () => {
      const { exitCode } = await runCli(["guard", "show"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("MIN_SECRET_BYTES"));
    });

    test("shows defaults when parse fails", async () => {
      mockParseEnvInput.mockImplementation(() => {
        throw new Error("Parse error");
      });

      const { exitCode } = await runCli(["guard", "show"], createMockReadStdin("invalid"));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("MIN_SECRET_BYTES"));
    });

    test("shows all guardrail keys", async () => {
      mockParseEnvInput.mockReturnValue({ entries: [] } as ReturnType<typeof parseEnvInput>);

      const { exitCode } = await runCli(["guard", "show"], createMockReadStdin("{}"));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("MIN_SECRET_BYTES"));
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("MAX_SECRET_BYTES"));
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("MIN_PERIOD"));
      expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining("MAX_PERIOD"));
    });
  });
});

describe("readStdin", () => {
  test("reads and concatenates chunks from stdin", async () => {
    const { readStdin } = await import("../shared/stdin.js");

    const originalStdin = process.stdin;
    const mockStdin = Readable.from([Buffer.from("hello "), Buffer.from("world")]);
    Object.defineProperty(process, "stdin", { value: mockStdin, writable: true });

    const result = await readStdin();

    Object.defineProperty(process, "stdin", { value: originalStdin, writable: true });

    expect(result).toBe("hello world");
  });

  test("trims whitespace from result", async () => {
    const { readStdin } = await import("../shared/stdin.js");

    const originalStdin = process.stdin;
    const mockStdin = Readable.from([Buffer.from("  data  \n")]);
    Object.defineProperty(process, "stdin", { value: mockStdin, writable: true });

    const result = await readStdin();

    Object.defineProperty(process, "stdin", { value: originalStdin, writable: true });

    expect(result).toBe("data");
  });

  test("returns empty string for empty stdin", async () => {
    const { readStdin } = await import("../shared/stdin.js");

    const originalStdin = process.stdin;
    const mockStdin = Readable.from([]);
    Object.defineProperty(process, "stdin", { value: mockStdin, writable: true });

    const result = await readStdin();

    Object.defineProperty(process, "stdin", { value: originalStdin, writable: true });

    expect(result).toBe("");
  });
});
