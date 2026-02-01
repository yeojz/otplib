import { describe, expect, test, vi, afterEach } from "vitest";
import fs from "node:fs";
import { deduplicateKeys } from "./dedup.js";

vi.mock("node:fs", () => ({
  default: {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
}));

const mockFs = vi.mocked(fs);

describe("deduplicateKeys", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("deduplicates keys, keeping the last occurrence", () => {
    const content = [
      "KEY1=encrypted:val1",
      "KEY2=encrypted:val2",
      "KEY1=encrypted:val1_updated",
    ].join("\n");

    mockFs.readFileSync.mockReturnValue(content);

    deduplicateKeys(".env.test");

    const expected = ["KEY2=encrypted:val2", "KEY1=encrypted:val1_updated"].join("\n");

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(".env.test", expected);
  });

  test("preserves comments and non-key lines", () => {
    const content = ["# Comment 1", "KEY1=val1", "", "# Comment 2", "KEY1=val2"].join("\n");

    mockFs.readFileSync.mockReturnValue(content);

    deduplicateKeys(".env.test");

    const expected = ["# Comment 1", "", "# Comment 2", "KEY1=val2"].join("\n");

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(".env.test", expected);
  });

  test("does nothing if no duplicates", () => {
    const content = ["KEY1=val1", "KEY2=val2"].join("\n");

    mockFs.readFileSync.mockReturnValue(content);

    deduplicateKeys(".env.test");

    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
  });

  test("handles multiple duplicates", () => {
    const content = ["KEY1=v1", "KEY1=v2", "KEY1=v3"].join("\n");

    mockFs.readFileSync.mockReturnValue(content);

    deduplicateKeys(".env.test");

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(".env.test", "KEY1=v3");
  });
});
