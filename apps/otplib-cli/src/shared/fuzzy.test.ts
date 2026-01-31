import { describe, expect, test } from "vitest";
import { fuzzyMatch } from "./fuzzy.js";

describe("fuzzyMatch", () => {
  test("matches exact string", () => {
    expect(fuzzyMatch("github", "GitHub")).toBe(true);
  });

  test("matches substring", () => {
    expect(fuzzyMatch("git", "GitHub")).toBe(true);
  });

  test("matches fuzzy pattern (characters in order)", () => {
    expect(fuzzyMatch("ghub", "GitHub")).toBe(true);
    expect(fuzzyMatch("gml", "gmail.com")).toBe(true);
    expect(fuzzyMatch("gthusr", "GitHub:user")).toBe(true);
  });

  test("is case insensitive", () => {
    expect(fuzzyMatch("GITHUB", "github")).toBe(true);
    expect(fuzzyMatch("github", "GITHUB")).toBe(true);
    expect(fuzzyMatch("GiThUb", "github")).toBe(true);
  });

  test("does not match when characters are out of order", () => {
    expect(fuzzyMatch("buhtig", "GitHub")).toBe(false);
  });

  test("does not match when characters are missing", () => {
    expect(fuzzyMatch("githubx", "GitHub")).toBe(false);
  });

  test("matches empty query to any target", () => {
    expect(fuzzyMatch("", "anything")).toBe(true);
  });

  test("does not match non-empty query to empty target", () => {
    expect(fuzzyMatch("a", "")).toBe(false);
  });

  test("matches empty query to empty target", () => {
    expect(fuzzyMatch("", "")).toBe(true);
  });
});
