import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Key } from "../../src/tui/keyboard.js";

// Mock keyboard module
vi.mock("../../src/tui/keyboard.js", () => ({
  createKeyboardReader: vi.fn(),
  isKey: vi.fn((key: Key, name: string, ctrl = false) => key.name === name && key.ctrl === ctrl),
}));

// Mock ansi module with minimal implementation
vi.mock("../../src/tui/ansi.js", () => ({
  ansi: {
    cursorHide: "",
    cursorShow: "",
    fg: { cyan: "" },
    dim: "",
    reset: "",
  },
  moveCursorUp: vi.fn(),
  clearLines: vi.fn(),
}));

import { createKeyboardReader } from "../../src/tui/keyboard.js";
import { selectFromList } from "../../src/tui/select-list.js";

const mockCreateKeyboardReader = vi.mocked(createKeyboardReader);

describe("selectFromList", () => {
  let capturedKeyHandler: (key: Key) => void;
  let originalStdin: typeof process.stdin;
  let originalStdout: typeof process.stdout;
  let mockStdout: { write: ReturnType<typeof vi.fn>; isTTY: boolean };

  beforeEach(() => {
    originalStdin = process.stdin;
    originalStdout = process.stdout;

    mockStdout = { write: vi.fn(), isTTY: true };

    Object.defineProperty(process, "stdout", {
      value: mockStdout,
      writable: true,
    });

    Object.defineProperty(process, "stdin", {
      value: { isTTY: true },
      writable: true,
    });

    mockCreateKeyboardReader.mockImplementation((_input, onKey) => {
      capturedKeyHandler = onKey;
      return { close: vi.fn() };
    });
  });

  afterEach(() => {
    Object.defineProperty(process, "stdin", { value: originalStdin, writable: true });
    Object.defineProperty(process, "stdout", { value: originalStdout, writable: true });
    vi.resetAllMocks();
  });

  const createKey = (name: string, ctrl = false, sequence = ""): Key => ({
    name,
    ctrl,
    meta: false,
    shift: false,
    sequence: sequence || name,
  });

  const testItems = [
    { id: "1", label: "Item One" },
    { id: "2", label: "Item Two" },
    { id: "3", label: "Item Three" },
  ];

  const defaultOptions = {
    items: testItems,
    renderItem: (item: (typeof testItems)[0], selected: boolean) =>
      selected ? `*${item.label}` : item.label,
    filterItem: (item: (typeof testItems)[0], query: string) =>
      item.label.toLowerCase().includes(query.toLowerCase()),
  };

  test("throws error when stdin is not TTY", async () => {
    Object.defineProperty(process, "stdin", { value: { isTTY: false }, writable: true });

    await expect(selectFromList(defaultOptions)).rejects.toThrow("Interactive mode requires a TTY");
  });

  test("throws error when stdout is not TTY", async () => {
    Object.defineProperty(process, "stdout", {
      value: { isTTY: false, write: vi.fn() },
      writable: true,
    });

    await expect(selectFromList(defaultOptions)).rejects.toThrow("Interactive mode requires a TTY");
  });

  test("returns cancel when escape is pressed", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("escape"));

    const result = await promise;
    expect(result).toEqual({ action: "cancel", item: null });
  });

  test("returns cancel when ctrl+c is pressed", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("c", true));

    const result = await promise;
    expect(result).toEqual({ action: "cancel", item: null });
  });

  test("returns copy-uid with selected item when u is pressed", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("u"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-uid", item: testItems[0] });
  });

  test("returns copy-otp with selected item when o is pressed", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("o"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-otp", item: testItems[0] });
  });

  test("navigates down with down arrow", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("down"));
    capturedKeyHandler(createKey("u"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-uid", item: testItems[1] });
  });

  test("navigates down with j key", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("j"));
    capturedKeyHandler(createKey("u"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-uid", item: testItems[1] });
  });

  test("navigates up with up arrow", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("down"));
    capturedKeyHandler(createKey("down"));
    capturedKeyHandler(createKey("up"));
    capturedKeyHandler(createKey("u"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-uid", item: testItems[1] });
  });

  test("navigates up with k key", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("down"));
    capturedKeyHandler(createKey("k"));
    capturedKeyHandler(createKey("u"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-uid", item: testItems[0] });
  });

  test("does not navigate past first item", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("up"));
    capturedKeyHandler(createKey("up"));
    capturedKeyHandler(createKey("u"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-uid", item: testItems[0] });
  });

  test("does not navigate past last item", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("down"));
    capturedKeyHandler(createKey("down"));
    capturedKeyHandler(createKey("down"));
    capturedKeyHandler(createKey("down"));
    capturedKeyHandler(createKey("u"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-uid", item: testItems[2] });
  });

  test("filters items by typing", async () => {
    const promise = selectFromList(defaultOptions);

    // Type "tw" to filter to "Item Two" (avoiding 'o' which is copy-otp action)
    capturedKeyHandler(createKey("t", false, "t"));
    capturedKeyHandler(createKey("w", false, "w"));
    capturedKeyHandler(createKey("u"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-uid", item: testItems[1] });
  });

  test("backspace removes last character from filter", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("x", false, "x"));
    capturedKeyHandler(createKey("backspace"));
    capturedKeyHandler(createKey("u"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-uid", item: testItems[0] });
  });

  test("ignores copy-uid when no items match filter", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("x", false, "x"));
    capturedKeyHandler(createKey("y", false, "y"));
    capturedKeyHandler(createKey("z", false, "z"));
    // 'u' is ignored when filtered list is empty
    capturedKeyHandler(createKey("u"));
    // Use escape to actually exit
    capturedKeyHandler(createKey("escape"));

    const result = await promise;
    expect(result).toEqual({ action: "cancel", item: null });
  });

  test("ignores copy-otp when no items match filter", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("x", false, "x"));
    capturedKeyHandler(createKey("y", false, "y"));
    // 'o' is ignored when filtered list is empty
    capturedKeyHandler(createKey("o"));
    // Use escape to actually exit
    capturedKeyHandler(createKey("escape"));

    const result = await promise;
    expect(result).toEqual({ action: "cancel", item: null });
  });

  test("clamps selectedIndex when filter reduces items", async () => {
    const promise = selectFromList(defaultOptions);

    // Navigate to last item (index 2)
    capturedKeyHandler(createKey("down"));
    capturedKeyHandler(createKey("down"));
    // Now filter to "Two" - should have only 1 item, clamping to index 0
    capturedKeyHandler(createKey("T", false, "T"));
    capturedKeyHandler(createKey("w", false, "w"));
    // Trigger render which clamps the index
    capturedKeyHandler(createKey("down"));
    capturedKeyHandler(createKey("u"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-uid", item: testItems[1] });
  });

  test("ignores keys with ctrl modifier for typing", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("a", true, "\x01"));
    capturedKeyHandler(createKey("u"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-uid", item: testItems[0] });
  });

  test("ignores keys with meta modifier for typing", async () => {
    const promise = selectFromList(defaultOptions);

    const key: Key = { name: "a", ctrl: false, meta: true, shift: false, sequence: "a" };
    capturedKeyHandler(key);
    capturedKeyHandler(createKey("u"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-uid", item: testItems[0] });
  });

  test("ignores multi-character sequences", async () => {
    const promise = selectFromList(defaultOptions);

    capturedKeyHandler(createKey("up", false, "\x1b[A"));
    capturedKeyHandler(createKey("u"));

    const result = await promise;
    expect(result).toEqual({ action: "copy-uid", item: testItems[0] });
  });

  test("uses custom pageSize", async () => {
    const promise = selectFromList({ ...defaultOptions, pageSize: 2 });

    capturedKeyHandler(createKey("escape"));

    await promise;
    expect(mockStdout.write).toHaveBeenCalled();
  });

  test("renders initially and on navigation", async () => {
    const promise = selectFromList(defaultOptions);

    // Initial render happens automatically
    const initialWriteCalls = mockStdout.write.mock.calls.length;

    capturedKeyHandler(createKey("down"));

    // Should have more write calls after navigation
    expect(mockStdout.write.mock.calls.length).toBeGreaterThan(initialWriteCalls);

    capturedKeyHandler(createKey("escape"));
    await promise;
  });

  test("handles empty items list", async () => {
    const promise = selectFromList({
      ...defaultOptions,
      items: [],
    });

    // With empty list, 'u' and 'o' are ignored, so we use escape
    capturedKeyHandler(createKey("escape"));

    const result = await promise;
    expect(result).toEqual({ action: "cancel", item: null });
  });
});
