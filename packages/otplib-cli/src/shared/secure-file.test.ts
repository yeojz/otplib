import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { writeSecretFile } from "./secure-file.js";

vi.mock("node:fs");

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

      expect(fs.openSync).toHaveBeenCalledWith("/tmp/secret", "w", 0o600);
      expect(fs.fchmodSync).toHaveBeenCalledWith(FD, 0o600);
      expect(fs.writeSync).toHaveBeenCalledWith(FD, "content");
      expect(fs.closeSync).toHaveBeenCalledWith(FD);

      const openOrder = vi.mocked(fs.openSync).mock.invocationCallOrder[0];
      const fchmodOrder = vi.mocked(fs.fchmodSync).mock.invocationCallOrder[0];
      const writeOrder = vi.mocked(fs.writeSync).mock.invocationCallOrder[0];
      const closeOrder = vi.mocked(fs.closeSync).mock.invocationCallOrder[0];

      expect(openOrder).toBeLessThan(fchmodOrder);
      expect(fchmodOrder).toBeLessThan(writeOrder);
      expect(writeOrder).toBeLessThan(closeOrder);
    });

    test("supports append flag", () => {
      writeSecretFile("/tmp/secret", "more\n", "a");

      expect(fs.openSync).toHaveBeenCalledWith("/tmp/secret", "a", 0o600);
      expect(fs.fchmodSync).toHaveBeenCalledWith(FD, 0o600);
      expect(fs.writeSync).toHaveBeenCalledWith(FD, "more\n");
      expect(fs.closeSync).toHaveBeenCalledWith(FD);
    });

    test("does not chmod on Windows, but still writes and closes", () => {
      Object.defineProperty(process, "platform", { value: "win32" });

      writeSecretFile("C:\\secret", "content");

      expect(fs.openSync).toHaveBeenCalledWith("C:\\secret", "w", 0o600);
      expect(fs.fchmodSync).not.toHaveBeenCalled();
      expect(fs.writeSync).toHaveBeenCalledWith(FD, "content");
      expect(fs.closeSync).toHaveBeenCalledWith(FD);
    });

    test("closes the descriptor and rethrows without writing when fchmod fails", () => {
      const error = new Error("fchmod failed");
      vi.mocked(fs.fchmodSync).mockImplementation(() => {
        throw error;
      });

      expect(() => writeSecretFile("/tmp/secret", "content")).toThrow(error);

      expect(fs.writeSync).not.toHaveBeenCalled();
      expect(fs.closeSync).toHaveBeenCalledWith(FD);
    });
  });
});
