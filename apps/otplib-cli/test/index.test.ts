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

vi.mock("../src/otp/generate.js", () => ({
  generateOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("../src/parse.js", () => ({
  parseAddInput: vi.fn(),
  parseDotenvxInput: vi.fn(),
  findEntry: vi.fn(),
  updateHotpCounter: vi.fn(),
}));

vi.mock("../src/tui/index.js", () => ({
  ansi: { fg: { cyan: "" }, dim: "", reset: "" },
  copyToClipboard: vi.fn(),
  selectFromList: vi.fn(),
}));

vi.mock("../src/types.js", () => ({
  formatOutput: vi.fn(),
  generateUid: vi.fn(),
  getLabel: vi.fn(),
}));

import fs from "node:fs";
import { generateOtp, verifyOtp } from "../src/otp/generate.js";
import { findEntry, parseAddInput, parseDotenvxInput, updateHotpCounter } from "../src/parse.js";
import { copyToClipboard, selectFromList } from "../src/tui/index.js";
import { formatOutput, generateUid, getLabel } from "../src/types.js";

const mockFs = vi.mocked(fs);
const mockGenerateOtp = vi.mocked(generateOtp);
const mockVerifyOtp = vi.mocked(verifyOtp);
const mockParseAddInput = vi.mocked(parseAddInput);
const mockParseDotenvxInput = vi.mocked(parseDotenvxInput);
const mockFindEntry = vi.mocked(findEntry);
const mockUpdateHotpCounter = vi.mocked(updateHotpCounter);
const mockCopyToClipboard = vi.mocked(copyToClipboard);
const mockSelectFromList = vi.mocked(selectFromList);
const mockFormatOutput = vi.mocked(formatOutput);
const mockGenerateUid = vi.mocked(generateUid);
const mockGetLabel = vi.mocked(getLabel);

function createMockStdin(data: string): NodeJS.ReadStream {
  const readable = Readable.from([Buffer.from(data)]);
  return readable as unknown as NodeJS.ReadStream;
}

function createEmptyStdin(): NodeJS.ReadStream {
  const readable = Readable.from([]);
  return readable as unknown as NodeJS.ReadStream;
}

async function runCli(args: string[], stdin: NodeJS.ReadStream): Promise<{ exitCode: number }> {
  const originalArgv = process.argv;
  const originalStdin = process.stdin;
  const originalExitCode = process.exitCode;

  process.argv = ["node", "otplib", ...args];
  Object.defineProperty(process, "stdin", { value: stdin, writable: true });
  process.exitCode = undefined;

  // Reset modules to get fresh commander instance
  vi.resetModules();

  // Re-import to get fresh instance
  await import("../src/index.js");

  // Wait for async operations
  await new Promise((resolve) => setImmediate(resolve));

  const exitCode = process.exitCode ?? 0;

  process.argv = originalArgv;
  Object.defineProperty(process, "stdin", { value: originalStdin, writable: true });
  process.exitCode = originalExitCode;

  return { exitCode };
}

// Mock commander to test parseAsync error handler
vi.mock("commander", async (importOriginal) => {
  const original = await importOriginal<typeof import("commander")>();
  return {
    ...original,
    Command: class extends original.Command {
      private shouldFailParse = false;

      parseAsync(argv: string[]): Promise<this> {
        // Check if we're in a test that wants parsing to fail
        if (argv.includes("--force-parse-error")) {
          this.shouldFailParse = true;
        }
        if (this.shouldFailParse) {
          return Promise.reject(new Error("Commander parse error"));
        }
        return super.parseAsync(argv);
      }
    },
  };
});

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

  describe("add command", () => {
    test("outputs error when stdin is empty", async () => {
      const { exitCode } = await runCli(["add"], createEmptyStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error: Expected otpauth URI or JSON from stdin",
      );
    });

    test("parses input and outputs formatted entry", async () => {
      const mockData = { type: "totp", secret: "ABC", algorithm: "SHA1", digits: 6, period: 30 };
      mockParseAddInput.mockReturnValue(mockData as ReturnType<typeof parseAddInput>);
      mockGenerateUid.mockReturnValue("test-uid");
      mockFormatOutput.mockReturnValue("UID=payload");

      const { exitCode } = await runCli(["add"], createMockStdin("otpauth://totp/Test?secret=ABC"));

      expect(exitCode).toBe(0);
      expect(mockParseAddInput).toHaveBeenCalledWith("otpauth://totp/Test?secret=ABC");
      expect(stdoutWriteSpy).toHaveBeenCalledWith("UID=payload");
    });

    test("saves UID to file when --save-uid is provided", async () => {
      const mockData = { type: "totp", secret: "ABC", algorithm: "SHA1", digits: 6, period: 30 };
      mockParseAddInput.mockReturnValue(mockData as ReturnType<typeof parseAddInput>);
      mockGenerateUid.mockReturnValue("test-uid");
      mockFormatOutput.mockReturnValue("UID=payload");
      mockFs.openSync.mockReturnValue(3);

      const { exitCode } = await runCli(
        ["add", "--save-uid", "/tmp/uids.txt"],
        createMockStdin("otpauth://totp/Test?secret=ABC"),
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
      mockFormatOutput.mockReturnValue("UID=payload");
      mockFs.openSync.mockImplementation(() => {
        throw new Error("Permission denied");
      });

      const { exitCode } = await runCli(
        ["add", "--save-uid", "/tmp/uids.txt"],
        createMockStdin("otpauth://totp/Test?secret=ABC"),
      );

      expect(exitCode).toBe(1);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("UID=payload");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Warning: Could not save UID"),
      );
    });

    test("handles parse error", async () => {
      mockParseAddInput.mockImplementation(() => {
        throw new Error("Invalid input");
      });

      const { exitCode } = await runCli(["add"], createMockStdin("invalid"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Invalid input");
    });
  });

  describe("list command", () => {
    test("outputs error when stdin is empty", async () => {
      const { exitCode } = await runCli(["list"], createEmptyStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Expected JSON from stdin");
    });

    test("outputs 'No entries' when list is empty", async () => {
      mockParseDotenvxInput.mockReturnValue([]);

      const { exitCode } = await runCli(["list"], createMockStdin("{}"));

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("No entries");
    });

    test("outputs entries in non-interactive mode", async () => {
      const entries = [
        { id: "id1", payload: { data: { type: "totp", secret: "A" } } },
        { id: "id2", payload: { data: { type: "hotp", secret: "B" } } },
      ];
      mockParseDotenvxInput.mockReturnValue(entries as ReturnType<typeof parseDotenvxInput>);
      mockGetLabel.mockImplementation((data) => (data as { secret: string }).secret);

      // stdin.isTTY is undefined/false by default in tests
      const { exitCode } = await runCli(["list"], createMockStdin('{"id1":"...","id2":"..."}'));

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("id1\ttotp\tA");
      expect(consoleLogSpy).toHaveBeenCalledWith("id2\thotp\tB");
    });

    test("handles parse error", async () => {
      mockParseDotenvxInput.mockImplementation(() => {
        throw new Error("Invalid JSON");
      });

      const { exitCode } = await runCli(["list"], createMockStdin("invalid"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Invalid JSON");
    });
  });

  describe("list command (interactive mode)", () => {
    async function runInteractiveCli(
      args: string[],
      stdinData: string,
    ): Promise<{ exitCode: number }> {
      const originalArgv = process.argv;
      const originalStdin = process.stdin;
      const originalExitCode = process.exitCode;

      // Create mock stdin that is a TTY
      const mockStdin = createMockStdin(stdinData);
      Object.defineProperty(mockStdin, "isTTY", { value: true, writable: true });

      process.argv = ["node", "otplib", ...args];
      Object.defineProperty(process, "stdin", { value: mockStdin, writable: true });
      process.exitCode = undefined;

      vi.resetModules();
      await import("../src/index.js");
      await new Promise((resolve) => setImmediate(resolve));

      const exitCode = process.exitCode ?? 0;

      process.argv = originalArgv;
      Object.defineProperty(process, "stdin", { value: originalStdin, writable: true });
      process.exitCode = originalExitCode;

      return { exitCode };
    }

    test("shows cancelled message when user cancels", async () => {
      const entries = [{ id: "id1", payload: { data: { type: "totp", secret: "A" } } }];
      mockParseDotenvxInput.mockReturnValue(entries as ReturnType<typeof parseDotenvxInput>);
      mockGetLabel.mockReturnValue("Test");
      mockSelectFromList.mockResolvedValue({ action: "cancel", item: null });

      const { exitCode } = await runInteractiveCli(["list"], "{}");

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("Cancelled");
    });

    test("copies UID to clipboard when copy-uid action", async () => {
      const entry = { id: "test-uid", payload: { data: { type: "totp", secret: "A" } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockGetLabel.mockReturnValue("Test");
      mockSelectFromList.mockResolvedValue({ action: "copy-uid", item: entry });
      mockCopyToClipboard.mockReturnValue(true);

      const { exitCode } = await runInteractiveCli(["list"], "{}");

      expect(exitCode).toBe(0);
      expect(mockCopyToClipboard).toHaveBeenCalledWith("test-uid");
      expect(consoleLogSpy).toHaveBeenCalledWith("Copied UID: test-uid");
    });

    test("outputs UID when clipboard fails for copy-uid", async () => {
      const entry = { id: "test-uid", payload: { data: { type: "totp", secret: "A" } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockGetLabel.mockReturnValue("Test");
      mockSelectFromList.mockResolvedValue({ action: "copy-uid", item: entry });
      mockCopyToClipboard.mockReturnValue(false);

      const { exitCode } = await runInteractiveCli(["list"], "{}");

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("test-uid");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Warning: Could not copy to clipboard");
    });

    test("copies OTP to clipboard when copy-otp action", async () => {
      const entry = { id: "test-uid", payload: { data: { type: "totp", secret: "A" } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockGetLabel.mockReturnValue("Test Account");
      mockSelectFromList.mockResolvedValue({ action: "copy-otp", item: entry });
      mockGenerateOtp.mockResolvedValue("123456");
      mockCopyToClipboard.mockReturnValue(true);

      const { exitCode } = await runInteractiveCli(["list"], "{}");

      expect(exitCode).toBe(0);
      expect(mockGenerateOtp).toHaveBeenCalledWith(entry.payload.data);
      expect(mockCopyToClipboard).toHaveBeenCalledWith("123456");
      expect(consoleLogSpy).toHaveBeenCalledWith("Copied OTP for Test Account");
    });

    test("outputs OTP when clipboard fails for copy-otp", async () => {
      const entry = { id: "test-uid", payload: { data: { type: "totp", secret: "A" } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockGetLabel.mockReturnValue("Test Account");
      mockSelectFromList.mockResolvedValue({ action: "copy-otp", item: entry });
      mockGenerateOtp.mockResolvedValue("654321");
      mockCopyToClipboard.mockReturnValue(false);

      const { exitCode } = await runInteractiveCli(["list"], "{}");

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("654321");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Warning: Could not copy to clipboard");
    });

    test("calls selectFromList with correct options", async () => {
      const entry = { id: "id1", payload: { data: { type: "totp", secret: "A" } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockGetLabel.mockReturnValue("Label");
      mockSelectFromList.mockResolvedValue({ action: "cancel", item: null });

      await runInteractiveCli(["list"], "{}");

      expect(mockSelectFromList).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [entry],
          renderItem: expect.any(Function),
          filterItem: expect.any(Function),
        }),
      );

      // Test the renderItem function
      const options = mockSelectFromList.mock.calls[0][0];
      const renderedSelected = options.renderItem(entry, true);
      const renderedUnselected = options.renderItem(entry, false);
      expect(renderedSelected).toContain("id1");
      expect(renderedUnselected).toContain("id1");

      // Test the filterItem function
      expect(options.filterItem(entry, "id1")).toBe(true);
      expect(options.filterItem(entry, "label")).toBe(true);
      expect(options.filterItem(entry, "xyz")).toBe(false);
    });
  });

  describe("totp token command", () => {
    test("outputs error when stdin is empty", async () => {
      const { exitCode } = await runCli(["totp", "token", "test-id"], createEmptyStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Expected JSON from stdin");
    });

    test("outputs error when entry not found", async () => {
      mockParseDotenvxInput.mockReturnValue([]);
      mockFindEntry.mockReturnValue(undefined);

      const { exitCode } = await runCli(["totp", "token", "missing"], createMockStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Entry not found: missing");
    });

    test("outputs error when entry is HOTP", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC" } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);

      const { exitCode } = await runCli(["totp", "token", "test"], createMockStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Entry test is HOTP, not TOTP");
    });

    test("generates and outputs TOTP token", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockGenerateOtp.mockResolvedValue("123456");

      const { exitCode } = await runCli(["totp", "token", "test"], createMockStdin("{}"));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("123456");
    });

    test("handles generation error", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockGenerateOtp.mockRejectedValue(new Error("Generation failed"));

      const { exitCode } = await runCli(["totp", "token", "test"], createMockStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Generation failed");
    });
  });

  describe("hotp token command", () => {
    test("outputs error when stdin is empty", async () => {
      const { exitCode } = await runCli(["hotp", "token", "test-id"], createEmptyStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Expected JSON from stdin");
    });

    test("outputs error when entry not found", async () => {
      mockParseDotenvxInput.mockReturnValue([]);
      mockFindEntry.mockReturnValue(undefined);

      const { exitCode } = await runCli(["hotp", "token", "missing"], createMockStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Entry not found: missing");
    });

    test("outputs error when entry is TOTP", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);

      const { exitCode } = await runCli(["hotp", "token", "test"], createMockStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Entry test is TOTP, not HOTP");
    });

    test("generates and outputs HOTP token", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 0 } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockGenerateOtp.mockResolvedValue("654321");

      const { exitCode } = await runCli(["hotp", "token", "test"], createMockStdin("{}"));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("654321");
    });

    test("handles generation error", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 0 } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockGenerateOtp.mockRejectedValue(new Error("HOTP generation failed"));

      const { exitCode } = await runCli(["hotp", "token", "test"], createMockStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: HOTP generation failed");
    });
  });

  describe("hotp update-counter command", () => {
    test("outputs error when stdin is empty", async () => {
      const { exitCode } = await runCli(["hotp", "update-counter", "test-id"], createEmptyStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Expected JSON from stdin");
    });

    test("outputs error when entry not found", async () => {
      mockParseDotenvxInput.mockReturnValue([]);
      mockFindEntry.mockReturnValue(undefined);

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "missing"],
        createMockStdin("{}"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Entry not found: missing");
    });

    test("outputs error when entry is TOTP", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);

      const { exitCode } = await runCli(["hotp", "update-counter", "test"], createMockStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Entry test is TOTP, not HOTP");
    });

    test("increments counter by default", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 5 } } };
      const updatedData = { type: "hotp", secret: "ABC", counter: 6 };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockUpdateHotpCounter.mockReturnValue(updatedData as ReturnType<typeof updateHotpCounter>);
      mockFormatOutput.mockReturnValue("test=updated");

      const { exitCode } = await runCli(["hotp", "update-counter", "test"], createMockStdin("{}"));

      expect(exitCode).toBe(0);
      expect(mockUpdateHotpCounter).toHaveBeenCalledWith(entry.payload.data, undefined);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("test=updated");
    });

    test("sets counter to specific value", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 5 } } };
      const updatedData = { type: "hotp", secret: "ABC", counter: 10 };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockUpdateHotpCounter.mockReturnValue(updatedData as ReturnType<typeof updateHotpCounter>);
      mockFormatOutput.mockReturnValue("test=updated");

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "test", "10"],
        createMockStdin("{}"),
      );

      expect(exitCode).toBe(0);
      expect(mockUpdateHotpCounter).toHaveBeenCalledWith(entry.payload.data, 10);
    });

    test("rejects invalid counter value", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 5 } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "test", "abc"],
        createMockStdin("{}"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Counter must be a non-negative integer");
    });

    test("rejects negative counter value", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 5 } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);

      const { exitCode } = await runCli(
        ["hotp", "update-counter", "test", "-1"],
        createMockStdin("{}"),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Counter must be a non-negative integer");
    });

    test("handles update error", async () => {
      const entry = { id: "test", payload: { data: { type: "hotp", secret: "ABC", counter: 5 } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockUpdateHotpCounter.mockImplementation(() => {
        throw new Error("Update failed");
      });

      const { exitCode } = await runCli(["hotp", "update-counter", "test"], createMockStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Update failed");
    });
  });

  describe("verify command", () => {
    test("outputs error when stdin is empty", async () => {
      const { exitCode } = await runCli(["verify", "test-id", "123456"], createEmptyStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Expected JSON from stdin");
    });

    test("outputs error when entry not found", async () => {
      mockParseDotenvxInput.mockReturnValue([]);
      mockFindEntry.mockReturnValue(undefined);

      const { exitCode } = await runCli(["verify", "missing", "123456"], createMockStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Entry not found: missing");
    });

    test("exits with 0 when token is valid", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockVerifyOtp.mockResolvedValue(true);

      const { exitCode } = await runCli(["verify", "test", "123456"], createMockStdin("{}"));

      expect(exitCode).toBe(0);
      expect(mockVerifyOtp).toHaveBeenCalledWith(entry.payload.data, "123456");
    });

    test("exits with 1 when token is invalid", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockVerifyOtp.mockResolvedValue(false);

      const { exitCode } = await runCli(["verify", "test", "000000"], createMockStdin("{}"));

      expect(exitCode).toBe(1);
    });

    test("handles verification error", async () => {
      const entry = { id: "test", payload: { data: { type: "totp", secret: "ABC" } } };
      mockParseDotenvxInput.mockReturnValue([entry] as ReturnType<typeof parseDotenvxInput>);
      mockFindEntry.mockReturnValue(entry as ReturnType<typeof findEntry>);
      mockVerifyOtp.mockRejectedValue(new Error("Verification failed"));

      const { exitCode } = await runCli(["verify", "test", "123456"], createMockStdin("{}"));

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Verification failed");
    });
  });

  describe("parseAsync error handling", () => {
    test("handles parseAsync rejection", async () => {
      const { exitCode } = await runCli(["--force-parse-error"], createEmptyStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Commander parse error");
    });
  });
});
