import { describe, expect, test, vi } from "vitest";
import { ansi, clearLines, moveCursorUp } from "../../src/tui/ansi.js";

describe("ansi constants", () => {
  test("cursor movement codes", () => {
    expect(ansi.cursorUp(1)).toBe("\x1b[1A");
    expect(ansi.cursorUp(5)).toBe("\x1b[5A");
    expect(ansi.cursorDown(1)).toBe("\x1b[1B");
    expect(ansi.cursorDown(3)).toBe("\x1b[3B");
    expect(ansi.cursorTo(10)).toBe("\x1b[10G");
    expect(ansi.cursorTo(5, 3)).toBe("\x1b[3;5H");
    expect(ansi.cursorSave).toBe("\x1b[s");
    expect(ansi.cursorRestore).toBe("\x1b[u");
    expect(ansi.cursorHide).toBe("\x1b[?25l");
    expect(ansi.cursorShow).toBe("\x1b[?25h");
  });

  test("erase codes", () => {
    expect(ansi.clearLine).toBe("\x1b[2K");
    expect(ansi.clearDown).toBe("\x1b[J");
    expect(ansi.clearScreen).toBe("\x1b[2J");
  });

  test("style codes", () => {
    expect(ansi.reset).toBe("\x1b[0m");
    expect(ansi.bold).toBe("\x1b[1m");
    expect(ansi.dim).toBe("\x1b[2m");
    expect(ansi.inverse).toBe("\x1b[7m");
  });

  test("foreground color codes", () => {
    expect(ansi.fg.black).toBe("\x1b[30m");
    expect(ansi.fg.red).toBe("\x1b[31m");
    expect(ansi.fg.green).toBe("\x1b[32m");
    expect(ansi.fg.yellow).toBe("\x1b[33m");
    expect(ansi.fg.blue).toBe("\x1b[34m");
    expect(ansi.fg.magenta).toBe("\x1b[35m");
    expect(ansi.fg.cyan).toBe("\x1b[36m");
    expect(ansi.fg.white).toBe("\x1b[37m");
    expect(ansi.fg.gray).toBe("\x1b[90m");
  });
});

describe("moveCursorUp", () => {
  test("writes cursor up code when lines > 0", () => {
    const mockStream = { write: vi.fn() } as unknown as NodeJS.WriteStream;

    moveCursorUp(mockStream, 3);

    expect(mockStream.write).toHaveBeenCalledWith("\x1b[3A");
  });

  test("does nothing when lines <= 0", () => {
    const mockStream = { write: vi.fn() } as unknown as NodeJS.WriteStream;

    moveCursorUp(mockStream, 0);
    moveCursorUp(mockStream, -1);

    expect(mockStream.write).not.toHaveBeenCalled();
  });
});

describe("clearLines", () => {
  test("clears single line", () => {
    const mockStream = { write: vi.fn() } as unknown as NodeJS.WriteStream;

    clearLines(mockStream, 1);

    expect(mockStream.write).toHaveBeenCalledWith("\x1b[2K");
    expect(mockStream.write).toHaveBeenCalledTimes(1);
  });

  test("clears multiple lines", () => {
    const mockStream = { write: vi.fn() } as unknown as NodeJS.WriteStream;

    clearLines(mockStream, 3);

    // For 3 lines: clearLine, cursorDown, clearLine, cursorDown, clearLine, then cursorUp(2)
    expect(mockStream.write).toHaveBeenCalledWith("\x1b[2K");
    expect(mockStream.write).toHaveBeenCalledWith("\x1b[1B");
    expect(mockStream.write).toHaveBeenCalledWith("\x1b[2A");
  });

  test("handles zero lines", () => {
    const mockStream = { write: vi.fn() } as unknown as NodeJS.WriteStream;

    clearLines(mockStream, 0);

    expect(mockStream.write).not.toHaveBeenCalled();
  });
});
