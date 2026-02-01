import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("./utils/dedup.js", () => ({
  deduplicateKeys: vi.fn(),
}));

vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    appendFileSync: vi.fn(),
  },
}));

vi.mock("./utils/exec.js", () => ({
  requireCommand: vi.fn(),
  runDotenvx: vi.fn(),
  runOtplib: vi.fn(),
}));

import fs from "node:fs";
import { createOtplibxCli } from "./index.js";
import { runDotenvx, runOtplib } from "./utils/exec.js";

const mockFs = vi.mocked(fs);
const mockRunDotenvx = vi.mocked(runDotenvx);
const mockRunOtplib = vi.mocked(runOtplib);

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
      mockFs.existsSync.mockReturnValue(false);
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });

      const { exitCode } = await runCli(["init", "test.env"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith("test.env", "", { mode: 0o600 });
      expect(consoleLogSpy).toHaveBeenCalledWith("Initialized: test.env");
    });

    test("uses default file when not specified", async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });

      const { exitCode } = await runCli(["init"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(".env.otplibx", "", { mode: 0o600 });
    });

    test("respects -f option", async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });

      const { exitCode } = await runCli(["-f", "custom.env", "init"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith("custom.env", "", { mode: 0o600 });
    });

    test("fails when file exists", async () => {
      mockFs.existsSync.mockReturnValue(true);

      const { exitCode } = await runCli(["init", "test.env"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: file already exists: test.env");
    });
  });

  describe("add command", () => {
    test("adds entry successfully", async () => {
      mockRunOtplib.mockReturnValue({
        stdout: "A12345678=base64payload",
        stderr: "",
        status: 0,
      });
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });

      const { exitCode } = await runCli(
        ["add"],
        createMockReadStdin("otpauth://totp/Test?secret=ABC"),
      );

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("A12345678");
    });

    test("fails with empty stdin", async () => {
      const { exitCode } = await runCli(["add"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "error: expected otpauth URI or JSON from stdin",
      );
    });

    test("passes bytes option to add function", async () => {
      mockRunOtplib.mockReturnValue({
        stdout: "A12345678=base64payload",
        stderr: "",
        status: 0,
      });
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });

      const { exitCode } = await runCli(
        ["add", "--bytes", "8"],
        createMockReadStdin("otpauth://totp/Test?secret=ABC"),
      );

      expect(exitCode).toBe(0);
      expect(mockRunOtplib).toHaveBeenCalledWith(["encode", "--bytes", "8"], expect.anything());
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
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "123456",
        stderr: "",
        status: 0,
      });

      const { exitCode } = await runCli(["token", "AABCDEF12"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("123456\n");
    });

    test("generates token without newline when -n is provided", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "123456",
        stderr: "",
        status: 0,
      });

      const { exitCode } = await runCli(["token", "-n", "AABCDEF12"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("123456");
    });

    test("reads ID from stdin when no argument provided", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "123456",
        stderr: "",
        status: 0,
      });

      const { exitCode } = await runCli(["token"], createMockReadStdin("AABCDEF12\n"));

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("123456\n");
    });

    test("fails when no ID argument and stdin is empty", async () => {
      const { exitCode } = await runCli(["token"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: missing entry ID");
    });
  });

  describe("type command", () => {
    test("outputs type with newline by default", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "totp",
        stderr: "",
        status: 0,
      });

      const { exitCode } = await runCli(["type", "AABCDEF12"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("totp\n");
    });

    test("outputs type without newline when -n is provided", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "hotp",
        stderr: "",
        status: 0,
      });

      const { exitCode } = await runCli(["type", "-n", "AABCDEF12"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("hotp");
    });

    test("reads ID from stdin when no argument provided", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "totp",
        stderr: "",
        status: 0,
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

    test("fails when type throws error", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "",
        stderr: "entry not found",
        status: 1,
      });

      const { exitCode } = await runCli(["type", "AABCDEF12"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: entry not found");
    });
  });

  describe("list command", () => {
    test("lists entries successfully", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "GitHub:user\tAABCDEF12\ttotp\n",
        stderr: "",
        status: 0,
      });

      const { exitCode } = await runCli(["list"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).toHaveBeenCalledWith("GitHub:user\tAABCDEF12\ttotp\n");
    });

    test("passes filter option to otplib", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "GitHub:user\tAABCDEF12\ttotp\n",
        stderr: "",
        status: 0,
      });

      const { exitCode } = await runCli(["list", "--filter", "github"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(mockRunOtplib).toHaveBeenCalledWith(["list", "--filter", "github"], expect.anything());
    });
  });

  describe("guard commands", () => {
    test("guard update sets guardrail value", async () => {
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });

      const { exitCode } = await runCli(
        ["guard", "update", "MIN_SECRET_BYTES", "8"],
        createEmptyReadStdin(),
      );

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("OTPLIB_MIN_SECRET_BYTES=8");
    });

    test("guard rm removes guardrail", async () => {
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });

      const { exitCode } = await runCli(
        ["guard", "rm", "MIN_SECRET_BYTES"],
        createEmptyReadStdin(),
      );

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("Removed: OTPLIB_MIN_SECRET_BYTES");
    });

    test("guard show displays configuration", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"OTPLIB_MIN_SECRET_BYTES":"8"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "MIN_SECRET_BYTES  8  16",
        stderr: "",
        status: 0,
      });

      const { exitCode } = await runCli(["guard", "show"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("MIN_SECRET_BYTES  8  16");
    });

    test("guard show does not log empty result", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: "{}",
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "",
        stderr: "",
        status: 0,
      });

      const { exitCode } = await runCli(["guard", "show"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    test("guard update fails with error", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: "",
        stderr: "write failed",
        status: 1,
      });

      const { exitCode } = await runCli(
        ["guard", "update", "MIN_SECRET_BYTES", "8"],
        createEmptyReadStdin(),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: dotenvx set failed: write failed");
    });

    test("guard rm fails with error", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: "",
        stderr: "write failed",
        status: 1,
      });

      const { exitCode } = await runCli(
        ["guard", "rm", "MIN_SECRET_BYTES"],
        createEmptyReadStdin(),
      );

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: dotenvx set failed: write failed");
    });

    test("guard show fails with error", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: "",
        stderr: "read failed",
        status: 1,
      });

      const { exitCode } = await runCli(["guard", "show"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: dotenvx get failed: read failed");
    });
  });

  describe("list command", () => {
    test("fails when list throws error", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "",
        stderr: "list error",
        status: 1,
      });

      const { exitCode } = await runCli(["list"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: otplib list failed: list error");
    });

    test("does not output when list returns empty", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: "{}",
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "",
        stderr: "",
        status: 0,
      });

      const { exitCode } = await runCli(["list"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
      expect(stdoutWriteSpy).not.toHaveBeenCalled();
    });
  });

  describe("token command", () => {
    test("fails when token throws error", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "",
        stderr: "entry not found",
        status: 1,
      });

      const { exitCode } = await runCli(["token", "AABCDEF12"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: entry not found");
    });
  });

  describe("verify command", () => {
    test("exits with 0 when token is valid", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "",
        stderr: "",
        status: 0,
      });

      const { exitCode } = await runCli(["verify", "AABCDEF12", "123456"], createEmptyReadStdin());

      expect(exitCode).toBe(0);
    });

    test("exits with 1 when token is invalid", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "",
        stderr: "",
        status: 1,
      });

      const { exitCode } = await runCli(["verify", "AABCDEF12", "000000"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
    });

    test("fails when verify throws error", async () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "",
        stderr: "entry not found",
        status: 1,
      });

      const { exitCode } = await runCli(["verify", "AABCDEF12", "123456"], createEmptyReadStdin());

      expect(exitCode).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("error: entry not found");
    });
  });
});
