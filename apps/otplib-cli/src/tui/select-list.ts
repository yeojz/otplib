import { ansi, clearLines, moveCursorUp } from "./ansi.js";
import { createKeyboardReader, isKey, type Key } from "./keyboard.js";

export type SelectAction = "copy-uid" | "copy-otp" | "cancel";

export type SelectResult<T> =
  | { action: "copy-uid"; item: T }
  | { action: "copy-otp"; item: T }
  | { action: "cancel"; item: null };

export type SelectListOptions<T> = {
  items: T[];
  renderItem: (item: T, selected: boolean) => string;
  filterItem: (item: T, query: string) => boolean;
  pageSize?: number;
};

export async function selectFromList<T>(options: SelectListOptions<T>): Promise<SelectResult<T>> {
  const { items, renderItem, filterItem, pageSize = 10 } = options;

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Interactive mode requires a TTY");
  }

  return new Promise((resolve) => {
    let query = "";
    let selectedIndex = 0;
    let lastRenderedLines = 0;

    const getFilteredItems = () =>
      query ? items.filter((item) => filterItem(item, query)) : items;

    const render = () => {
      const output = process.stdout;
      const filtered = getFilteredItems();

      // Clear previous render
      if (lastRenderedLines > 0) {
        moveCursorUp(output, lastRenderedLines);
        clearLines(output, lastRenderedLines);
      }

      // Clamp selected index
      if (selectedIndex >= filtered.length) {
        selectedIndex = Math.max(0, filtered.length - 1);
      }

      const lines: string[] = [];

      // Filter input line
      lines.push(`${ansi.fg.cyan}>${ansi.reset} ${query}${ansi.dim}_${ansi.reset}`);
      lines.push("");

      // Items (paginated)
      const startIdx = Math.max(
        0,
        Math.min(selectedIndex - Math.floor(pageSize / 2), filtered.length - pageSize),
      );
      const endIdx = Math.min(startIdx + pageSize, filtered.length);

      if (filtered.length === 0) {
        lines.push(`${ansi.dim}  No matches${ansi.reset}`);
      } else {
        for (let i = startIdx; i < endIdx; i++) {
          const isSelected = i === selectedIndex;
          const prefix = isSelected ? `${ansi.fg.cyan}>${ansi.reset}` : " ";
          lines.push(`${prefix} ${renderItem(filtered[i], isSelected)}`);
        }
      }

      // Footer
      lines.push("");
      lines.push(
        `${ansi.dim}[u] copy UID  [o] copy OTP  [up/down] navigate  [esc] cancel${ansi.reset}`,
      );

      output.write(lines.join("\n"));
      lastRenderedLines = lines.length;
    };

    const finish = (action: SelectAction) => {
      keyboard.close();

      // Clear the UI
      const output = process.stdout;
      moveCursorUp(output, lastRenderedLines);
      clearLines(output, lastRenderedLines);
      output.write(ansi.cursorShow);

      const filtered = getFilteredItems();
      if (action === "cancel" || filtered.length === 0) {
        resolve({ action: "cancel", item: null });
      } else {
        resolve({ action, item: filtered[selectedIndex] } as SelectResult<T>);
      }
    };

    const handleKey = (key: Key) => {
      const filtered = getFilteredItems();

      if (isKey(key, "escape") || isKey(key, "c", true)) {
        finish("cancel");
        return;
      }

      if (isKey(key, "up") || isKey(key, "k")) {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render();
        return;
      }

      if (isKey(key, "down") || isKey(key, "j")) {
        selectedIndex = Math.min(filtered.length - 1, selectedIndex + 1);
        render();
        return;
      }

      if (isKey(key, "u") && filtered.length > 0) {
        finish("copy-uid");
        return;
      }

      if (isKey(key, "o") && filtered.length > 0) {
        finish("copy-otp");
        return;
      }

      if (isKey(key, "backspace")) {
        query = query.slice(0, -1);
        selectedIndex = 0;
        render();
        return;
      }

      // Regular character input
      if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
        query += key.sequence;
        selectedIndex = 0;
        render();
      }
    };

    // Hide cursor and start
    process.stdout.write(ansi.cursorHide);
    const keyboard = createKeyboardReader(process.stdin, handleKey);
    render();
  });
}
