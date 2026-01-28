import { afterEach, describe, expect, test, vi } from "vitest";
import readline from "node:readline";
import { createKeyboardReader, isKey, type Key } from "../../src/tui/keyboard.js";
import { EventEmitter } from "node:events";

vi.mock("node:readline", () => ({
  default: {
    emitKeypressEvents: vi.fn(),
  },
}));

describe("createKeyboardReader", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  test("sets up keypress events and raw mode for TTY", () => {
    const mockInput = new EventEmitter() as NodeJS.ReadStream;
    mockInput.isTTY = true;
    mockInput.setRawMode = vi.fn().mockReturnThis();
    mockInput.resume = vi.fn();
    mockInput.pause = vi.fn();

    const onKey = vi.fn();
    const reader = createKeyboardReader(mockInput, onKey);

    expect(readline.emitKeypressEvents).toHaveBeenCalledWith(mockInput);
    expect(mockInput.setRawMode).toHaveBeenCalledWith(true);
    expect(mockInput.resume).toHaveBeenCalled();
    expect(reader.close).toBeInstanceOf(Function);
  });

  test("skips setRawMode for non-TTY", () => {
    const mockInput = new EventEmitter() as NodeJS.ReadStream;
    mockInput.isTTY = false;
    mockInput.resume = vi.fn();
    mockInput.pause = vi.fn();

    const onKey = vi.fn();
    createKeyboardReader(mockInput, onKey);

    expect(mockInput.setRawMode).toBeUndefined();
  });

  test("calls onKey when keypress event with key is emitted", () => {
    const mockInput = new EventEmitter() as NodeJS.ReadStream;
    mockInput.isTTY = false;
    mockInput.resume = vi.fn();
    mockInput.pause = vi.fn();

    const onKey = vi.fn();
    createKeyboardReader(mockInput, onKey);

    const key: Key = { name: "a", ctrl: false, meta: false, shift: false, sequence: "a" };
    mockInput.emit("keypress", "a", key);

    expect(onKey).toHaveBeenCalledWith(key);
  });

  test("ignores keypress event without key", () => {
    const mockInput = new EventEmitter() as NodeJS.ReadStream;
    mockInput.isTTY = false;
    mockInput.resume = vi.fn();
    mockInput.pause = vi.fn();

    const onKey = vi.fn();
    createKeyboardReader(mockInput, onKey);

    mockInput.emit("keypress", "a", undefined);

    expect(onKey).not.toHaveBeenCalled();
  });

  test("close removes listener and resets raw mode for TTY", () => {
    const mockInput = new EventEmitter() as NodeJS.ReadStream;
    mockInput.isTTY = true;
    mockInput.setRawMode = vi.fn().mockReturnThis();
    mockInput.resume = vi.fn();
    mockInput.pause = vi.fn();

    const onKey = vi.fn();
    const reader = createKeyboardReader(mockInput, onKey);

    reader.close();

    expect(mockInput.setRawMode).toHaveBeenCalledWith(false);
    expect(mockInput.pause).toHaveBeenCalled();
    expect(mockInput.listenerCount("keypress")).toBe(0);
  });

  test("close only pauses for non-TTY", () => {
    const mockInput = new EventEmitter() as NodeJS.ReadStream;
    mockInput.isTTY = false;
    mockInput.resume = vi.fn();
    mockInput.pause = vi.fn();

    const onKey = vi.fn();
    const reader = createKeyboardReader(mockInput, onKey);

    reader.close();

    expect(mockInput.pause).toHaveBeenCalled();
    expect(mockInput.listenerCount("keypress")).toBe(0);
  });
});

describe("isKey", () => {
  test("returns true when key matches name without ctrl", () => {
    const key: Key = { name: "escape", ctrl: false, meta: false, shift: false, sequence: "\x1b" };

    expect(isKey(key, "escape")).toBe(true);
  });

  test("returns true when key matches name with ctrl", () => {
    const key: Key = { name: "c", ctrl: true, meta: false, shift: false, sequence: "\x03" };

    expect(isKey(key, "c", true)).toBe(true);
  });

  test("returns false when name does not match", () => {
    const key: Key = { name: "a", ctrl: false, meta: false, shift: false, sequence: "a" };

    expect(isKey(key, "b")).toBe(false);
  });

  test("returns false when ctrl does not match", () => {
    const key: Key = { name: "c", ctrl: true, meta: false, shift: false, sequence: "\x03" };

    expect(isKey(key, "c", false)).toBe(false);
  });
});
