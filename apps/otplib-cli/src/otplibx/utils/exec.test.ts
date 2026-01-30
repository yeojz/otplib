import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
  spawnSync: vi.fn(),
}));

import { execSync, spawnSync } from "node:child_process";
import { checkCommand, requireCommand, runDotenvx, runOtplib } from "./exec.js";

const mockExecSync = vi.mocked(execSync);
const mockSpawnSync = vi.mocked(spawnSync);

describe("exec utilities", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("runDotenvx", () => {
    test("executes dotenvx with arguments", () => {
      mockSpawnSync.mockReturnValue({
        stdout: "output",
        stderr: "",
        status: 0,
        signal: null,
        pid: 1234,
        output: ["", "output", ""],
      });

      const result = runDotenvx(["encrypt", "-f", "test.env"]);

      expect(mockSpawnSync).toHaveBeenCalledWith(
        "dotenvx",
        ["encrypt", "-f", "test.env"],
        expect.objectContaining({
          encoding: "utf-8",
        }),
      );
      expect(result.stdout).toBe("output");
      expect(result.status).toBe(0);
    });

    test("passes stdin when provided", () => {
      mockSpawnSync.mockReturnValue({
        stdout: "output",
        stderr: "",
        status: 0,
        signal: null,
        pid: 1234,
        output: ["", "output", ""],
      });

      runDotenvx(["get"], { stdin: "input data" });

      expect(mockSpawnSync).toHaveBeenCalledWith(
        "dotenvx",
        ["get"],
        expect.objectContaining({
          input: "input data",
        }),
      );
    });

    test("returns error status on failure", () => {
      mockSpawnSync.mockReturnValue({
        stdout: "",
        stderr: "error message",
        status: 1,
        signal: null,
        pid: 1234,
        output: ["", "", "error message"],
      });

      const result = runDotenvx(["invalid"]);

      expect(result.status).toBe(1);
      expect(result.stderr).toBe("error message");
    });

    test("handles null stdout", () => {
      mockSpawnSync.mockReturnValue({
        stdout: null as unknown as string,
        stderr: "",
        status: 0,
        signal: null,
        pid: 1234,
        output: [null, null, ""],
      });

      const result = runDotenvx(["test"]);

      expect(result.stdout).toBe("");
    });

    test("handles null stderr", () => {
      mockSpawnSync.mockReturnValue({
        stdout: "output",
        stderr: null as unknown as string,
        status: 0,
        signal: null,
        pid: 1234,
        output: ["", "output", null],
      });

      const result = runDotenvx(["test"]);

      expect(result.stderr).toBe("");
    });

    test("handles null status", () => {
      mockSpawnSync.mockReturnValue({
        stdout: "",
        stderr: "",
        status: null,
        signal: "SIGTERM",
        pid: 1234,
        output: ["", "", ""],
      });

      const result = runDotenvx(["test"]);

      expect(result.status).toBe(1);
    });
  });

  describe("runOtplib", () => {
    test("executes otplib with arguments", () => {
      mockSpawnSync.mockReturnValue({
        stdout: "AABCDEF12=payload",
        stderr: "",
        status: 0,
        signal: null,
        pid: 1234,
        output: ["", "AABCDEF12=payload", ""],
      });

      const result = runOtplib(["encode"]);

      expect(mockSpawnSync).toHaveBeenCalledWith(
        "otplib",
        ["encode"],
        expect.objectContaining({
          encoding: "utf-8",
        }),
      );
      expect(result.stdout).toBe("AABCDEF12=payload");
      expect(result.status).toBe(0);
    });

    test("passes stdin when provided", () => {
      mockSpawnSync.mockReturnValue({
        stdout: "123456",
        stderr: "",
        status: 0,
        signal: null,
        pid: 1234,
        output: ["", "123456", ""],
      });

      runOtplib(["token", "AABCDEF12"], { stdin: '{"AABCDEF12":"data"}' });

      expect(mockSpawnSync).toHaveBeenCalledWith(
        "otplib",
        ["token", "AABCDEF12"],
        expect.objectContaining({
          input: '{"AABCDEF12":"data"}',
        }),
      );
    });
  });

  describe("checkCommand", () => {
    test("returns true when command exists", () => {
      mockExecSync.mockReturnValue("/usr/bin/dotenvx");

      const result = checkCommand("dotenvx");

      expect(result).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith("command -v dotenvx", {
        encoding: "utf-8",
        stdio: "pipe",
      });
    });

    test("returns false when command does not exist", () => {
      mockExecSync.mockImplementation(() => {
        throw new Error("command not found");
      });

      const result = checkCommand("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("requireCommand", () => {
    test("does not throw when command exists", () => {
      mockExecSync.mockReturnValue("/usr/bin/dotenvx");

      expect(() => requireCommand("dotenvx")).not.toThrow();
    });

    test("throws when command does not exist", () => {
      mockExecSync.mockImplementation(() => {
        throw new Error("command not found");
      });

      expect(() => requireCommand("nonexistent")).toThrow(
        "nonexistent is required but not installed",
      );
    });
  });
});
