import { describe, it, expect } from "vitest";

describe("internal testing utils", () => {
  it("exports byte helpers", async () => {
    const testing = await import("./index.js");

    expect(typeof testing.stringToBytes).toBe("function");
    expect(typeof testing.counterToBytes).toBe("function");
    expect(typeof testing.hexToBytes).toBe("function");

    if (
      typeof testing.stringToBytes !== "function" ||
      typeof testing.counterToBytes !== "function" ||
      typeof testing.hexToBytes !== "function"
    ) {
      return;
    }

    expect(testing.stringToBytes("hi")).toEqual(new TextEncoder().encode("hi"));
    expect(testing.counterToBytes(1)).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1]));
    expect(testing.hexToBytes("ff")).toEqual(new Uint8Array([255]));
  });

  it("exports hexToNumber", async () => {
    const testing = await import("./index.js");

    expect(typeof testing.hexToNumber).toBe("function");

    if (typeof testing.hexToNumber !== "function") {
      return;
    }

    expect(testing.hexToNumber("ff")).toBe(255);
  });
});
