import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { chmodSecure, writeSecretFile } from "./secure-file.js";

vi.mock("node:fs");

describe("secure-file", () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  describe("chmodSecure", () => {
    test("chmods the file to 0600 on POSIX platforms", () => {
      chmodSecure("/tmp/secret");

      expect(fs.chmodSync).toHaveBeenCalledWith("/tmp/secret", 0o600);
    });

    test("is a no-op on Windows", () => {
      Object.defineProperty(process, "platform", { value: "win32" });

      chmodSecure("C:\\secret");

      expect(fs.chmodSync).not.toHaveBeenCalled();
    });
  });

  describe("writeSecretFile", () => {
    test("writes with mode 0600 and defaults to overwrite", () => {
      writeSecretFile("/tmp/secret", "content");

      expect(fs.writeFileSync).toHaveBeenCalledWith("/tmp/secret", "content", {
        mode: 0o600,
        flag: "w",
      });
      expect(fs.chmodSync).toHaveBeenCalledWith("/tmp/secret", 0o600);
    });

    test("supports append flag", () => {
      writeSecretFile("/tmp/secret", "more\n", "a");

      expect(fs.writeFileSync).toHaveBeenCalledWith("/tmp/secret", "more\n", {
        mode: 0o600,
        flag: "a",
      });
      expect(fs.chmodSync).toHaveBeenCalledWith("/tmp/secret", 0o600);
    });

    test("does not chmod on Windows even after writing", () => {
      Object.defineProperty(process, "platform", { value: "win32" });

      writeSecretFile("C:\\secret", "content");

      expect(fs.writeFileSync).toHaveBeenCalledWith("C:\\secret", "content", {
        mode: 0o600,
        flag: "w",
      });
      expect(fs.chmodSync).not.toHaveBeenCalled();
    });
  });
});
