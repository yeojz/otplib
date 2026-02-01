import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../utils/dedup.js", () => ({
  deduplicateKeys: vi.fn(),
}));

vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    appendFileSync: vi.fn(),
    mkdtempSync: vi.fn(),
    renameSync: vi.fn(),
    rmSync: vi.fn(),
  },
}));

vi.mock("../utils/exec.js", () => ({
  requireCommand: vi.fn(),
  runDotenvx: vi.fn(),
  runOtplib: vi.fn(),
}));

import fs from "node:fs";
import { add } from "./add.js";
import { deduplicateKeys } from "../utils/dedup.js";
import { guardRm, guardShow, guardUpdate } from "./guard.js";
import { updateCounter } from "./hotp.js";
import { init } from "./init.js";
import { list } from "./list.js";
import { token } from "./token.js";
import { type } from "./type.js";
import { verify } from "./verify.js";
import { requireCommand, runDotenvx, runOtplib } from "../utils/exec.js";

const mockFs = vi.mocked(fs);
const mockRequireCommand = vi.mocked(requireCommand);
const mockRunDotenvx = vi.mocked(runDotenvx);
const mockRunOtplib = vi.mocked(runOtplib);

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
    test("creates new encrypted file", () => {
      mockFs.existsSync.mockReturnValue(false);
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });

      init({ file: ".env.test" });

      expect(mockRequireCommand).toHaveBeenCalledWith("dotenvx");
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(".env.test", "", { mode: 0o600 });
      expect(mockRunDotenvx).toHaveBeenCalledWith(["encrypt", "-f", ".env.test"]);
      expect(consoleLogSpy).toHaveBeenCalledWith("Initialized: .env.test");
    });

    test("throws if file already exists", () => {
      mockFs.existsSync.mockReturnValue(true);

      expect(() => init({ file: ".env.test" })).toThrow("file already exists: .env.test");
    });

    test("cleans up file if dotenvx encrypt fails", () => {
      mockFs.existsSync.mockReturnValue(false);
      mockRunDotenvx.mockReturnValue({
        stdout: "",
        stderr: "encrypt failed",
        status: 1,
      });

      expect(() => init({ file: ".env.test" })).toThrow("dotenvx encrypt failed");
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(".env.test");
    });
  });

  describe("add", () => {
    beforeEach(() => {
      mockFs.readFileSync.mockImplementation(() => {
        const err = new Error("file missing") as NodeJS.ErrnoException;
        err.code = "ENOENT";
        throw err;
      });
      mockFs.mkdtempSync.mockReturnValue("/tmp/otplibx-abc");
    });

    test("adds entry via otplib and dotenvx", () => {
      mockRunOtplib.mockReturnValue({
        stdout: "A12345678=base64payload",
        stderr: "",
        status: 0,
      });
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });

      const result = add("otpauth://totp/Test?secret=ABC", { file: ".env.test" });

      expect(mockRequireCommand).toHaveBeenCalledWith("otplib");
      expect(mockRequireCommand).toHaveBeenCalledWith("dotenvx");
      expect(mockRunOtplib).toHaveBeenCalledWith(["encode"], {
        stdin: "otpauth://totp/Test?secret=ABC",
      });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        "/tmp/otplibx-abc/.env.test",
        "A12345678=base64payload\n",
      );
      expect(mockRunDotenvx).toHaveBeenCalledWith(["encrypt", "-f", "/tmp/otplibx-abc/.env.test"]);
      expect(mockFs.renameSync).toHaveBeenCalledWith("/tmp/otplibx-abc/.env.test", ".env.test");
      expect(result).toBe("A12345678");
    });

    test("writes to temp file then replaces target", () => {
      mockRunOtplib.mockReturnValue({
        stdout: "A12345678=base64payload",
        stderr: "",
        status: 0,
      });
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue("EXISTING=encrypted");
      mockFs.mkdtempSync.mockReturnValue("/tmp/otplibx-abc");

      add("otpauth://totp/Test?secret=ABC", { file: ".env.test" });

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        "/tmp/otplibx-abc/.env.test",
        "EXISTING=encrypted\nA12345678=base64payload\n",
      );
      expect(mockRunDotenvx).toHaveBeenCalledWith(["encrypt", "-f", "/tmp/otplibx-abc/.env.test"]);
      expect(mockFs.renameSync).toHaveBeenCalledWith("/tmp/otplibx-abc/.env.test", ".env.test");
      expect(mockFs.rmSync).toHaveBeenCalledWith("/tmp/otplibx-abc", {
        recursive: true,
        force: true,
      });
    });

    test("cleans up temp dir if encrypt fails", () => {
      mockRunOtplib.mockReturnValue({
        stdout: "AABCDEF12=payload",
        stderr: "",
        status: 0,
      });
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "encrypt failed", status: 1 });
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdtempSync.mockReturnValue("/tmp/otplibx-abc");

      expect(() => add("otpauth://totp/Test?secret=ABC", { file: ".env.test" })).toThrow(
        "dotenvx encrypt failed",
      );

      expect(mockFs.rmSync).toHaveBeenCalledWith("/tmp/otplibx-abc", {
        recursive: true,
        force: true,
      });
    });

    test("warns if deduplication fails", () => {
      mockRunOtplib.mockReturnValue({
        stdout: "A12345678=base64payload",
        stderr: "",
        status: 0,
      });
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });
      vi.mocked(deduplicateKeys).mockImplementation(() => {
        throw new Error("dedup error");
      });

      add("otpauth://totp/Test?secret=ABC", { file: ".env.test" });

      expect(consoleErrorSpy).toHaveBeenCalledWith("warning: deduplication failed: dedup error");
    });

    test("throws if input is empty", () => {
      expect(() => add("", { file: ".env.test" })).toThrow(
        "expected otpauth URI or JSON from stdin",
      );
    });

    test("throws if otplib add fails", () => {
      mockRunOtplib.mockReturnValue({
        stdout: "",
        stderr: "parse error",
        status: 1,
      });

      expect(() => add("invalid", { file: ".env.test" })).toThrow("otplib add failed");
    });

    test("throws if write to file fails", () => {
      mockRunOtplib.mockReturnValue({
        stdout: "AABCDEF12=payload",
        stderr: "",
        status: 0,
      });
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error("permission denied");
      });

      expect(() => add("otpauth://totp/Test?secret=ABC", { file: ".env.test" })).toThrow(
        "failed to write to .env.test: permission denied",
      );
    });

    test("throws if dotenvx encrypt fails", () => {
      mockRunOtplib.mockReturnValue({
        stdout: "AABCDEF12=payload",
        stderr: "",
        status: 0,
      });
      mockRunDotenvx.mockReturnValue({
        stdout: "",
        stderr: "encrypt failed",
        status: 1,
      });

      expect(() => add("otpauth://totp/Test?secret=ABC", { file: ".env.test" })).toThrow(
        "dotenvx encrypt failed",
      );
      expect(mockRunDotenvx).toHaveBeenCalledWith(["encrypt", "-f", "/tmp/otplibx-abc/.env.test"]);
      expect(mockFs.rmSync).toHaveBeenCalledWith("/tmp/otplibx-abc", {
        recursive: true,
        force: true,
      });
    });

    test("throws if otplib output has no equals sign", () => {
      mockRunOtplib.mockReturnValue({
        stdout: "malformed_output_no_equals",
        stderr: "",
        status: 0,
      });

      expect(() => add("otpauth://totp/Test?secret=ABC", { file: ".env.test" })).toThrow(
        "failed to parse key from otplib output",
      );
    });

    test("throws if otplib output has empty key", () => {
      mockRunOtplib.mockReturnValue({
        stdout: "=payload",
        stderr: "",
        status: 0,
      });

      expect(() => add("otpauth://totp/Test?secret=ABC", { file: ".env.test" })).toThrow(
        "failed to parse key from otplib output",
      );
    });

    test("throws if otplib output has empty value", () => {
      mockRunOtplib.mockReturnValue({
        stdout: "AABCDEF12=",
        stderr: "",
        status: 0,
      });

      expect(() => add("otpauth://totp/Test?secret=ABC", { file: ".env.test" })).toThrow(
        "failed to parse value from otplib output",
      );
    });

    test("passes bytes option to otplib encode", () => {
      mockRunOtplib.mockReturnValue({
        stdout: "A12345678=base64payload",
        stderr: "",
        status: 0,
      });
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });

      const result = add("otpauth://totp/Test?secret=ABC", { file: ".env.test", bytes: 8 });

      expect(mockRunOtplib).toHaveBeenCalledWith(["encode", "--bytes", "8"], {
        stdin: "otpauth://totp/Test?secret=ABC",
      });
      expect(result).toBe("A12345678");
    });
  });

  describe("token", () => {
    test("generates token with newline", () => {
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

      const result = token("AABCDEF12", { file: ".env.test", newline: true });

      expect(mockRunDotenvx).toHaveBeenCalledWith(["get", "-f", ".env.test"]);
      expect(mockRunOtplib).toHaveBeenCalledWith(["token", "AABCDEF12"], {
        stdin: '{"AABCDEF12":"data"}',
      });
      expect(result).toBe("123456");
    });

    test("generates token without newline", () => {
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

      const result = token("AABCDEF12", { file: ".env.test", newline: false });

      expect(mockRunOtplib).toHaveBeenCalledWith(["token", "-n", "AABCDEF12"], {
        stdin: '{"AABCDEF12":"data"}',
      });
      expect(result).toBe("123456");
    });

    test("throws if id is missing", () => {
      expect(() => token("", { file: ".env.test", newline: true })).toThrow(
        "missing required argument: <id>",
      );
    });

    test("throws if dotenvx get fails", () => {
      mockRunDotenvx.mockReturnValue({
        stdout: "",
        stderr: "read failed",
        status: 1,
      });

      expect(() => token("AABCDEF12", { file: ".env.test", newline: true })).toThrow(
        "dotenvx get failed",
      );
    });

    test("throws if otplib token fails with stderr", () => {
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

      expect(() => token("AABCDEF12", { file: ".env.test", newline: true })).toThrow(
        "entry not found",
      );
    });

    test("throws generic error if otplib token fails without stderr", () => {
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

      expect(() => token("AABCDEF12", { file: ".env.test", newline: true })).toThrow(
        "otplib token failed",
      );
    });
  });

  describe("type", () => {
    test("returns type with newline option true", () => {
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

      const result = type("AABCDEF12", { file: ".env.test", newline: true });

      expect(mockRequireCommand).toHaveBeenCalledWith("otplib");
      expect(mockRequireCommand).toHaveBeenCalledWith("dotenvx");
      expect(mockRunDotenvx).toHaveBeenCalledWith(["get", "-f", ".env.test"]);
      expect(mockRunOtplib).toHaveBeenCalledWith(["type", "AABCDEF12"], {
        stdin: '{"AABCDEF12":"data"}',
      });
      expect(result).toBe("totp");
    });

    test("returns type without newline option", () => {
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

      const result = type("AABCDEF12", { file: ".env.test", newline: false });

      expect(mockRunOtplib).toHaveBeenCalledWith(["type", "-n", "AABCDEF12"], {
        stdin: '{"AABCDEF12":"data"}',
      });
      expect(result).toBe("hotp");
    });

    test("throws if id is missing", () => {
      expect(() => type("", { file: ".env.test", newline: true })).toThrow(
        "missing required argument: <id>",
      );
    });

    test("throws if dotenvx get fails", () => {
      mockRunDotenvx.mockReturnValue({
        stdout: "",
        stderr: "read failed",
        status: 1,
      });

      expect(() => type("AABCDEF12", { file: ".env.test", newline: true })).toThrow(
        "dotenvx get failed",
      );
    });

    test("throws if otplib type fails with stderr", () => {
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

      expect(() => type("AABCDEF12", { file: ".env.test", newline: true })).toThrow(
        "entry not found",
      );
    });

    test("throws generic error if otplib type fails without stderr", () => {
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

      expect(() => type("AABCDEF12", { file: ".env.test", newline: true })).toThrow(
        "otplib type failed",
      );
    });
  });

  describe("list", () => {
    test("lists entries via dotenvx and otplib", () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "AABCDEF12\ttotp\tGitHub:user",
        stderr: "",
        status: 0,
      });

      const result = list({ file: ".env.test" });

      expect(mockRunDotenvx).toHaveBeenCalledWith(["get", "-f", ".env.test"]);
      expect(mockRunOtplib).toHaveBeenCalledWith(["list"], {
        stdin: '{"AABCDEF12":"data"}',
      });
      expect(result).toBe("AABCDEF12\ttotp\tGitHub:user");
    });

    test("throws if dotenvx get fails", () => {
      mockRunDotenvx.mockReturnValue({
        stdout: "",
        stderr: "read failed",
        status: 1,
      });

      expect(() => list({ file: ".env.test" })).toThrow("dotenvx get failed");
    });

    test("throws if otplib list fails", () => {
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

      expect(() => list({ file: ".env.test" })).toThrow("otplib list failed");
    });

    test("passes filter to otplib list", () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "AABCDEF12\ttotp\tGitHub:user",
        stderr: "",
        status: 0,
      });

      const result = list({ file: ".env.test", filter: "github" });

      expect(mockRunOtplib).toHaveBeenCalledWith(["list", "--filter", "github"], {
        stdin: '{"AABCDEF12":"data"}',
      });
      expect(result).toBe("AABCDEF12\ttotp\tGitHub:user");
    });
  });

  describe("hotp update-counter", () => {
    beforeEach(() => {
      mockFs.readFileSync.mockImplementation(() => {
        const err = new Error("file missing") as NodeJS.ErrnoException;
        err.code = "ENOENT";
        throw err;
      });
      mockFs.mkdtempSync.mockReturnValue("/tmp/otplibx-abc");
    });

    test("updates counter and writes updated entry", () => {
      mockRunDotenvx.mockReturnValueOnce({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "AABCDEF12=base64payload",
        stderr: "",
        status: 0,
      });
      const result = updateCounter("AABCDEF12", { file: ".env.test" });

      expect(mockRunDotenvx).toHaveBeenCalledWith(["get", "-f", ".env.test"]);
      expect(mockRunOtplib).toHaveBeenCalledWith(["hotp", "update-counter", "AABCDEF12"], {
        stdin: '{"AABCDEF12":"data"}',
      });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        "/tmp/otplibx-abc/.env.test",
        "AABCDEF12=base64payload\n",
      );
      expect(mockRunDotenvx).toHaveBeenCalledWith(["encrypt", "-f", "/tmp/otplibx-abc/.env.test"]);
      expect(mockFs.renameSync).toHaveBeenCalledWith("/tmp/otplibx-abc/.env.test", ".env.test");
      expect(mockFs.rmSync).toHaveBeenCalledWith("/tmp/otplibx-abc", {
        recursive: true,
        force: true,
      });
      expect(result).toBe("AABCDEF12");
    });

    test("passes counter to otplib update-counter", () => {
      mockRunDotenvx.mockReturnValueOnce({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "AABCDEF12=base64payload",
        stderr: "",
        status: 0,
      });
      mockRunDotenvx.mockReturnValueOnce({ stdout: "", stderr: "", status: 0 });

      updateCounter("AABCDEF12", { file: ".env.test", counter: 10 });

      expect(mockRunOtplib).toHaveBeenCalledWith(["hotp", "update-counter", "AABCDEF12", "10"], {
        stdin: '{"AABCDEF12":"data"}',
      });
    });

    test("throws if id is missing", () => {
      expect(() => updateCounter("", { file: ".env.test" })).toThrow(
        "missing required argument: <id>",
      );
    });

    test("throws if dotenvx get fails", () => {
      mockRunDotenvx.mockReturnValue({
        stdout: "",
        stderr: "read failed",
        status: 1,
      });

      expect(() => updateCounter("AABCDEF12", { file: ".env.test" })).toThrow("dotenvx get failed");
    });

    test("throws if otplib update fails", () => {
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

      expect(() => updateCounter("AABCDEF12", { file: ".env.test" })).toThrow("update failed");
    });

    test("throws if otplib output is empty", () => {
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

      expect(() => updateCounter("AABCDEF12", { file: ".env.test" })).toThrow(
        "failed to parse updated entry from otplib output",
      );
    });

    test("throws if otplib output has no equals sign", () => {
      mockRunDotenvx.mockReturnValueOnce({
        stdout: '{"AABCDEF12":"data"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "malformed_output_no_equals",
        stderr: "",
        status: 0,
      });

      expect(() => updateCounter("AABCDEF12", { file: ".env.test" })).toThrow(
        "failed to parse key from otplib output",
      );
    });
  });

  describe("verify", () => {
    test("returns true for valid token", () => {
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

      const result = verify("AABCDEF12", "123456", { file: ".env.test" });

      expect(mockRequireCommand).toHaveBeenCalledWith("otplib");
      expect(mockRequireCommand).toHaveBeenCalledWith("dotenvx");
      expect(mockRunDotenvx).toHaveBeenCalledWith(["get", "-f", ".env.test"]);
      expect(mockRunOtplib).toHaveBeenCalledWith(["verify", "AABCDEF12", "123456"], {
        stdin: '{"AABCDEF12":"data"}',
      });
      expect(result).toBe(true);
    });

    test("returns false for invalid token", () => {
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

      const result = verify("AABCDEF12", "000000", { file: ".env.test" });

      expect(result).toBe(false);
    });

    test("throws if id is missing", () => {
      expect(() => verify("", "123456", { file: ".env.test" })).toThrow(
        "missing required argument: <id>",
      );
    });

    test("throws if token is missing", () => {
      expect(() => verify("AABCDEF12", "", { file: ".env.test" })).toThrow(
        "missing required argument: <token>",
      );
    });

    test("throws if dotenvx get fails", () => {
      mockRunDotenvx.mockReturnValue({
        stdout: "",
        stderr: "read failed",
        status: 1,
      });

      expect(() => verify("AABCDEF12", "123456", { file: ".env.test" })).toThrow(
        "dotenvx get failed",
      );
    });

    test("throws if otplib verify fails with stderr", () => {
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

      expect(() => verify("AABCDEF12", "123456", { file: ".env.test" })).toThrow("entry not found");
    });
  });

  describe("guard update", () => {
    test("updates guardrail value", () => {
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });

      const result = guardUpdate("MIN_SECRET_BYTES", "8", { file: ".env.test" });

      expect(mockRequireCommand).toHaveBeenCalledWith("dotenvx");
      expect(mockRunDotenvx).toHaveBeenCalledWith([
        "set",
        "OTPLIB_MIN_SECRET_BYTES",
        "8",
        "-f",
        ".env.test",
      ]);
      expect(result).toBe("OTPLIB_MIN_SECRET_BYTES=8");
    });

    test("accepts key with OTPLIB_ prefix", () => {
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });

      const result = guardUpdate("OTPLIB_MAX_PERIOD", "7200", { file: ".env.test" });

      expect(mockRunDotenvx).toHaveBeenCalledWith([
        "set",
        "OTPLIB_MAX_PERIOD",
        "7200",
        "-f",
        ".env.test",
      ]);
      expect(result).toBe("OTPLIB_MAX_PERIOD=7200");
    });

    test("throws for invalid guardrail key", () => {
      expect(() => guardUpdate("INVALID_KEY", "10", { file: ".env.test" })).toThrow(
        "invalid guardrail key",
      );
    });

    test("throws for non-positive value", () => {
      expect(() => guardUpdate("MIN_SECRET_BYTES", "0", { file: ".env.test" })).toThrow(
        "value must be a positive integer",
      );
    });

    test("throws for non-integer value", () => {
      expect(() => guardUpdate("MIN_SECRET_BYTES", "abc", { file: ".env.test" })).toThrow(
        "value must be a positive integer",
      );
    });

    test("throws for missing key", () => {
      expect(() => guardUpdate("", "10", { file: ".env.test" })).toThrow(
        "missing required argument: <key>",
      );
    });

    test("throws for missing value", () => {
      expect(() => guardUpdate("MIN_SECRET_BYTES", "", { file: ".env.test" })).toThrow(
        "missing required argument: <value>",
      );
    });

    test("throws if dotenvx set fails", () => {
      mockRunDotenvx.mockReturnValue({
        stdout: "",
        stderr: "write failed",
        status: 1,
      });

      expect(() => guardUpdate("MIN_SECRET_BYTES", "8", { file: ".env.test" })).toThrow(
        "dotenvx set failed",
      );
    });
  });

  describe("guard rm", () => {
    test("removes guardrail", () => {
      mockRunDotenvx.mockReturnValue({ stdout: "", stderr: "", status: 0 });

      const result = guardRm("MIN_SECRET_BYTES", { file: ".env.test" });

      expect(mockRunDotenvx).toHaveBeenCalledWith([
        "set",
        "OTPLIB_MIN_SECRET_BYTES",
        "",
        "-f",
        ".env.test",
      ]);
      expect(result).toBe("Removed: OTPLIB_MIN_SECRET_BYTES");
    });

    test("throws for missing key", () => {
      expect(() => guardRm("", { file: ".env.test" })).toThrow("missing required argument: <key>");
    });

    test("throws for invalid guardrail key", () => {
      expect(() => guardRm("INVALID_KEY", { file: ".env.test" })).toThrow("invalid guardrail key");
    });

    test("throws if dotenvx set fails", () => {
      mockRunDotenvx.mockReturnValue({
        stdout: "",
        stderr: "write failed",
        status: 1,
      });

      expect(() => guardRm("MIN_SECRET_BYTES", { file: ".env.test" })).toThrow(
        "dotenvx set failed",
      );
    });
  });

  describe("guard show", () => {
    test("shows guardrail configuration", () => {
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

      const result = guardShow({ file: ".env.test" });

      expect(mockRunDotenvx).toHaveBeenCalledWith(["get", "-f", ".env.test"]);
      expect(mockRunOtplib).toHaveBeenCalledWith(["guard", "show"], {
        stdin: '{"OTPLIB_MIN_SECRET_BYTES":"8"}',
      });
      expect(result).toBe("MIN_SECRET_BYTES  8  16");
    });

    test("throws if dotenvx get fails", () => {
      mockRunDotenvx.mockReturnValue({
        stdout: "",
        stderr: "read failed",
        status: 1,
      });

      expect(() => guardShow({ file: ".env.test" })).toThrow("dotenvx get failed");
    });

    test("throws if otplib guard show fails", () => {
      mockRunDotenvx.mockReturnValue({
        stdout: '{"OTPLIB_MIN_SECRET_BYTES":"8"}',
        stderr: "",
        status: 0,
      });
      mockRunOtplib.mockReturnValue({
        stdout: "",
        stderr: "guard error",
        status: 1,
      });

      expect(() => guardShow({ file: ".env.test" })).toThrow("otplib guard show failed");
    });
  });
});
