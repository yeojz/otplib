// Cursor movement and screen control
export const ansi = {
  // Cursor
  cursorUp: (n = 1) => `\x1b[${n}A`,
  cursorDown: (n = 1) => `\x1b[${n}B`,
  cursorTo: (x: number, y?: number) => (y !== undefined ? `\x1b[${y};${x}H` : `\x1b[${x}G`),
  cursorSave: "\x1b[s",
  cursorRestore: "\x1b[u",
  cursorHide: "\x1b[?25l",
  cursorShow: "\x1b[?25h",

  // Erase
  clearLine: "\x1b[2K",
  clearDown: "\x1b[J",
  clearScreen: "\x1b[2J",

  // Colors
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  inverse: "\x1b[7m",

  // Foreground colors
  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
  },
} as const;

export function moveCursorUp(stream: NodeJS.WriteStream, lines: number): void {
  if (lines > 0) {
    stream.write(ansi.cursorUp(lines));
  }
}

export function clearLines(stream: NodeJS.WriteStream, count: number): void {
  for (let i = 0; i < count; i++) {
    stream.write(ansi.clearLine);
    if (i < count - 1) {
      stream.write(ansi.cursorDown());
    }
  }
  moveCursorUp(stream, count - 1);
}
