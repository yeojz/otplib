import fs from "node:fs";

export function deduplicateKeys(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const keyMap = new Map<string, number>();

  // First pass: identify the last line index for each key
  lines.forEach((line, index) => {
    // Match KEY=... lines.
    // keys in .env usually match [a-zA-Z_]+[a-zA-Z0-9_]*
    // We'll use a slightly broader regex to capture typical env keys
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)=/);
    if (match) {
      keyMap.set(match[1], index);
    }
  });

  // Second pass: filter
  const newLines = lines.filter((line, index) => {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)=/);
    if (match) {
      // Keep only if this is the last occurrence of this key
      return keyMap.get(match[1]) === index;
    }
    // Keep non-key lines (comments, whitespace, etc)
    return true;
  });

  // Only write back if changes were made
  if (newLines.length !== lines.length) {
    fs.writeFileSync(filePath, newLines.join("\n"));
  }
}
