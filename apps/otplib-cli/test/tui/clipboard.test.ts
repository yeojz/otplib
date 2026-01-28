import { afterEach, describe, expect, test, vi } from "vitest";
import * as childProcess from "node:child_process";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

const mockExecSync = vi.mocked(childProcess.execSync);

describe("copyToClipboard", () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  test("uses pbcopy on darwin", async () => {
    vi.stubGlobal("process", { ...process, platform: "darwin" });

    const { copyToClipboard } = await import("../../src/tui/clipboard.js");
    const result = copyToClipboard("test text");

    expect(mockExecSync).toHaveBeenCalledWith("pbcopy", { input: "test text" });
    expect(result).toBe(true);
  });

  test("uses clip on win32", async () => {
    vi.stubGlobal("process", { ...process, platform: "win32" });
    vi.resetModules();

    const { copyToClipboard } = await import("../../src/tui/clipboard.js");
    const result = copyToClipboard("test text");

    expect(mockExecSync).toHaveBeenCalledWith("clip", { input: "test text" });
    expect(result).toBe(true);
  });

  test("uses xclip on linux", async () => {
    vi.stubGlobal("process", { ...process, platform: "linux" });
    vi.resetModules();

    const { copyToClipboard } = await import("../../src/tui/clipboard.js");
    const result = copyToClipboard("test text");

    expect(mockExecSync).toHaveBeenCalledWith("xclip -selection clipboard", { input: "test text" });
    expect(result).toBe(true);
  });

  test("falls back to xsel when xclip fails on linux", async () => {
    vi.stubGlobal("process", { ...process, platform: "linux" });
    vi.resetModules();

    mockExecSync.mockImplementation((cmd) => {
      if (cmd === "xclip -selection clipboard") {
        throw new Error("xclip not found");
      }
      return Buffer.from("");
    });

    const { copyToClipboard } = await import("../../src/tui/clipboard.js");
    const result = copyToClipboard("test text");

    expect(mockExecSync).toHaveBeenCalledWith("xclip -selection clipboard", { input: "test text" });
    expect(mockExecSync).toHaveBeenCalledWith("xsel --clipboard --input", { input: "test text" });
    expect(result).toBe(true);
  });

  test("returns false when clipboard fails", async () => {
    vi.stubGlobal("process", { ...process, platform: "darwin" });
    vi.resetModules();

    mockExecSync.mockImplementation(() => {
      throw new Error("clipboard error");
    });

    const { copyToClipboard } = await import("../../src/tui/clipboard.js");
    const result = copyToClipboard("test text");

    expect(result).toBe(false);
  });

  test("returns false when xsel also fails on linux", async () => {
    vi.stubGlobal("process", { ...process, platform: "linux" });
    vi.resetModules();

    mockExecSync.mockImplementation(() => {
      throw new Error("no clipboard tool");
    });

    const { copyToClipboard } = await import("../../src/tui/clipboard.js");
    const result = copyToClipboard("test text");

    expect(result).toBe(false);
  });
});
