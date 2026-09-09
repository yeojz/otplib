import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { writeSecretFile } from "./secure-file.js";

vi.mock("node:fs");

const { O_WRONLY, O_CREAT, O_TRUNC, O_APPEND, O_NOFOLLOW } = fs.constants;
const WRITE_FLAGS = O_WRONLY | O_CREAT | O_TRUNC;
const APPEND_FLAGS = O_WRONLY | O_CREAT | O_APPEND;

describe("secure-file", () => {
  const originalPlatform = process.platform;
  const FD = 42;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fs.openSync).mockReturnValue(FD);
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  describe("writeSecretFile", () => {
    test("opens, fchmods, writes and closes in order, defaulting to overwrite", () => {
      writeSecretFile("/tmp/secret", "content");

      expect(fs.openSync).toHaveBeenCalledWith("/tmp/secret", WRITE_FLAGS | O_NOFOLLOW, 0o600);
      expect(fs.fchmodSync).toHaveBeenCalledWith(FD, 0o600);
      expect(fs.writeFileSync).toHaveBeenCalledWith(FD, "content");
      expect(fs.closeSync).toHaveBeenCalledWith(FD);

      const openOrder = vi.mocked(fs.openSync).mock.invocationCallOrder[0];
      const fchmodOrder = vi.mocked(fs.fchmodSync).mock.invocationCallOrder[0];
      const writeOrder = vi.mocked(fs.writeFileSync).mock.invocationCallOrder[0];
      const closeOrder = vi.mocked(fs.closeSync).mock.invocationCallOrder[0];

      expect(openOrder).toBeLessThan(fchmodOrder);
      expect(fchmodOrder).toBeLessThan(writeOrder);
      expect(writeOrder).toBeLessThan(closeOrder);
    });

    test("supports append flag", () => {
      writeSecretFile("/tmp/secret", "more\n", "a");

      expect(fs.openSync).toHaveBeenCalledWith("/tmp/secret", APPEND_FLAGS | O_NOFOLLOW, 0o600);
      expect(fs.fchmodSync).toHaveBeenCalledWith(FD, 0o600);
      expect(fs.writeFileSync).toHaveBeenCalledWith(FD, "more\n");
      expect(fs.closeSync).toHaveBeenCalledWith(FD);
    });

    test("does not chmod or set O_NOFOLLOW on Windows, but still writes and closes", () => {
      Object.defineProperty(process, "platform", { value: "win32" });

      writeSecretFile("C:\\secret", "content");

      expect(fs.openSync).toHaveBeenCalledWith("C:\\secret", WRITE_FLAGS, 0o600);
      expect(fs.fchmodSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(FD, "content");
      expect(fs.closeSync).toHaveBeenCalledWith(FD);
    });

    test("closes the descriptor and rethrows without writing when fchmod fails", () => {
      const error = new Error("fchmod failed");
      vi.mocked(fs.fchmodSync).mockImplementation(() => {
        throw error;
      });

      expect(() => writeSecretFile("/tmp/secret", "content")).toThrow(error);

      expect(fs.writeFileSync).not.toHaveBeenCalled();
      expect(fs.closeSync).toHaveBeenCalledWith(FD);
    });

    test("refuses to write through a symlink (ELOOP from the O_NOFOLLOW open)", () => {
      const error = Object.assign(new Error("ELOOP"), { code: "ELOOP" });
      vi.mocked(fs.openSync).mockImplementation(() => {
        throw error;
      });

      expect(() => writeSecretFile("/tmp/secret", "content")).toThrow(/symlink/i);

      expect(fs.fchmodSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
      expect(fs.closeSync).not.toHaveBeenCalled();
    });

    test("rethrows other open errors unchanged", () => {
      const error = Object.assign(new Error("EACCES"), { code: "EACCES" });
      vi.mocked(fs.openSync).mockImplementation(() => {
        throw error;
      });

      expect(() => writeSecretFile("/tmp/secret", "content")).toThrow(error);
    });
  });
});
