import { describe, expect, test } from "vitest";

import { parseEnvFile, serializeEnvFile } from "./env-parser.js";

describe("env-parser", () => {
  describe("parseEnvFile", () => {
    test("parses simple KEY=value pairs", () => {
      const content = "KEY1=value1\nKEY2=value2";
      const { entries } = parseEnvFile(content);

      expect(entries.get("KEY1")).toBe("value1");
      expect(entries.get("KEY2")).toBe("value2");
    });

    test("parses double-quoted values", () => {
      const content = 'KEY="some value"';
      const { entries } = parseEnvFile(content);

      expect(entries.get("KEY")).toBe("some value");
    });

    test("parses single-quoted values", () => {
      const content = "KEY='some value'";
      const { entries } = parseEnvFile(content);

      expect(entries.get("KEY")).toBe("some value");
    });

    test("skips empty lines", () => {
      const content = "KEY1=value1\n\nKEY2=value2\n\n";
      const { entries } = parseEnvFile(content);

      expect(entries.size).toBe(2);
      expect(entries.get("KEY1")).toBe("value1");
      expect(entries.get("KEY2")).toBe("value2");
    });

    test("skips comment lines", () => {
      const content = "# This is a comment\nKEY=value\n# Another comment";
      const { entries } = parseEnvFile(content);

      expect(entries.size).toBe(1);
      expect(entries.get("KEY")).toBe("value");
    });

    test("preserves original lines", () => {
      const content = "# Comment\nKEY=value\n\n";
      const { lines } = parseEnvFile(content);

      expect(lines).toEqual(["# Comment", "KEY=value", "", ""]);
    });

    test("handles keys with underscores and numbers", () => {
      const content = "MY_KEY_123=value";
      const { entries } = parseEnvFile(content);

      expect(entries.get("MY_KEY_123")).toBe("value");
    });

    test("handles values containing equals sign", () => {
      const content = 'KEY="value=with=equals"';
      const { entries } = parseEnvFile(content);

      expect(entries.get("KEY")).toBe("value=with=equals");
    });

    test("handles empty content", () => {
      const { entries } = parseEnvFile("");

      expect(entries.size).toBe(0);
    });

    test("handles values without quotes", () => {
      const content = "KEY=unquoted_value";
      const { entries } = parseEnvFile(content);

      expect(entries.get("KEY")).toBe("unquoted_value");
    });

    test("skips lines that do not match KEY=value pattern", () => {
      const content = "KEY=value\nmalformed line\n123invalid=value";
      const { entries } = parseEnvFile(content);

      expect(entries.size).toBe(1);
      expect(entries.get("KEY")).toBe("value");
    });
  });

  describe("serializeEnvFile", () => {
    test("serializes simple entries", () => {
      const entries = new Map([["KEY", "value"]]);
      const result = serializeEnvFile("", entries);

      expect(result).toBe("KEY=value");
    });

    test("updates existing entries in place", () => {
      const original = "KEY1=old1\nKEY2=old2";
      const entries = new Map([
        ["KEY1", "new1"],
        ["KEY2", "new2"],
      ]);
      const result = serializeEnvFile(original, entries);

      expect(result).toBe("KEY1=new1\nKEY2=new2");
    });

    test("preserves comments", () => {
      const original = "# Comment\nKEY=value";
      const entries = new Map([["KEY", "newvalue"]]);
      const result = serializeEnvFile(original, entries);

      expect(result).toBe("# Comment\nKEY=newvalue");
    });

    test("preserves empty lines", () => {
      const original = "KEY1=value1\n\nKEY2=value2";
      const entries = new Map([
        ["KEY1", "value1"],
        ["KEY2", "value2"],
      ]);
      const result = serializeEnvFile(original, entries);

      expect(result).toBe("KEY1=value1\n\nKEY2=value2");
    });

    test("removes entries not in the new map", () => {
      const original = "KEY1=value1\nKEY2=value2";
      const entries = new Map([["KEY1", "value1"]]);
      const result = serializeEnvFile(original, entries);

      expect(result).toBe("KEY1=value1");
    });

    test("appends new entries at the end", () => {
      const original = "KEY1=value1";
      const entries = new Map([
        ["KEY1", "value1"],
        ["KEY2", "value2"],
      ]);
      const result = serializeEnvFile(original, entries);

      expect(result).toBe("KEY1=value1\nKEY2=value2");
    });

    test("quotes values with spaces", () => {
      const entries = new Map([["KEY", "value with spaces"]]);
      const result = serializeEnvFile("", entries);

      expect(result).toBe('KEY="value with spaces"');
    });

    test("quotes values with special characters", () => {
      const entries = new Map([["KEY", 'value"quote']]);
      const result = serializeEnvFile("", entries);

      expect(result).toBe('KEY="value\\"quote"');
    });

    test("quotes values with hash", () => {
      const entries = new Map([["KEY", "value#comment"]]);
      const result = serializeEnvFile("", entries);

      expect(result).toBe('KEY="value#comment"');
    });

    test("quotes values with newlines", () => {
      const entries = new Map([["KEY", "line1\nline2"]]);
      const result = serializeEnvFile("", entries);

      expect(result).toBe('KEY="line1\\nline2"');
    });

    test("updates existing key with value that needs quotes", () => {
      const original = "KEY=oldvalue";
      const entries = new Map([["KEY", "value with spaces"]]);
      const result = serializeEnvFile(original, entries);

      expect(result).toBe('KEY="value with spaces"');
    });

    test("preserves malformed lines (non-KEY= format)", () => {
      const original = "KEY=value\nmalformed line without equals\nKEY2=value2";
      const entries = new Map([
        ["KEY", "value"],
        ["KEY2", "value2"],
      ]);
      const result = serializeEnvFile(original, entries);

      expect(result).toBe("KEY=value\nmalformed line without equals\nKEY2=value2");
    });

    test("appends new key with value that needs quotes", () => {
      const original = "KEY1=value1";
      const entries = new Map([
        ["KEY1", "value1"],
        ["KEY2", "value with spaces"],
      ]);
      const result = serializeEnvFile(original, entries);

      expect(result).toBe('KEY1=value1\nKEY2="value with spaces"');
    });
  });
});
