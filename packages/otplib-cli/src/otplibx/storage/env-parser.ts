/**
 * Simple .env file parser that handles KEY="value" format
 * Preserves comments and whitespace
 */

export interface ParsedEnvFile {
  entries: Map<string, string>;
  lines: string[];
}

/**
 * Parse a .env file content into key-value pairs
 * Returns both the entries and the original lines for preservation
 */
export function parseEnvFile(content: string): ParsedEnvFile {
  const entries = new Map<string, string>();
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    // Match KEY=value or KEY="value" patterns
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, rawValue] = match;
      // Remove surrounding quotes if present
      let value = rawValue;
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      entries.set(key, value);
    }
  }

  return { entries, lines };
}

/**
 * Serialize entries back to .env format
 * Updates existing keys in place and appends new keys at the end
 */
export function serializeEnvFile(originalContent: string, entries: Map<string, string>): string {
  // Handle empty original content - just serialize the entries
  if (!originalContent) {
    const resultLines: string[] = [];
    for (const [key, value] of entries) {
      if (needsQuotes(value)) {
        resultLines.push(`${key}="${escapeValue(value)}"`);
      } else {
        resultLines.push(`${key}=${value}`);
      }
    }
    return resultLines.join("\n");
  }

  const lines = originalContent.split("\n");
  const processedKeys = new Set<string>();
  const resultLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Preserve empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      resultLines.push(line);
      continue;
    }

    // Check if this line has a key we need to update
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (match) {
      const key = match[1];
      processedKeys.add(key);

      const value = entries.get(key);
      if (value !== undefined) {
        // Use double quotes for values containing special characters
        if (needsQuotes(value)) {
          resultLines.push(`${key}="${escapeValue(value)}"`);
        } else {
          resultLines.push(`${key}=${value}`);
        }
      }
      // If key is not in entries, it was removed - skip it
    } else {
      resultLines.push(line);
    }
  }

  // Append new keys that weren't in the original file
  for (const [key, value] of entries) {
    if (!processedKeys.has(key)) {
      if (needsQuotes(value)) {
        resultLines.push(`${key}="${escapeValue(value)}"`);
      } else {
        resultLines.push(`${key}=${value}`);
      }
    }
  }

  return resultLines.join("\n");
}

/**
 * Check if a value needs to be quoted
 */
function needsQuotes(value: string): boolean {
  // Quote if contains spaces, special chars, or starts/ends with whitespace
  return (
    value.includes(" ") ||
    value.includes('"') ||
    value.includes("'") ||
    value.includes("\n") ||
    value.includes("=") ||
    value.includes("#") ||
    value !== value.trim()
  );
}

/**
 * Escape special characters in a value for .env format
 */
function escapeValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}
