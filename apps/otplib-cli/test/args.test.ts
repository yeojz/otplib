import { describe, expect, test } from "vitest";
import { parseArgs } from "../src/cli/args.js";

describe("parseArgs", () => {
  test("parses vault init command", () => {
    const result = parseArgs(["vault", "init"]);
    expect(result.command).toBe("vault");
    expect(result.subcommand).toBe("init");
  });

  test("parses vault init with --vault flag", () => {
    const result = parseArgs(["vault", "init", "--vault", "./work.vault"]);
    expect(result.command).toBe("vault");
    expect(result.subcommand).toBe("init");
    expect(result.vault).toBe("./work.vault");
  });

  test("parses vault update pw command", () => {
    const result = parseArgs(["vault", "update", "pw"]);
    expect(result.command).toBe("vault");
    expect(result.subcommand).toBe("update");
    expect(result.args).toEqual(["pw"]);
  });

  test("parses existing add command unchanged", () => {
    const result = parseArgs(["add"]);
    expect(result.command).toBe("add");
    expect(result.subcommand).toBeUndefined();
  });

  test("parses flags before command", () => {
    const result = parseArgs(["--vault", "./work.vault", "vault", "init"]);
    expect(result.vault).toBe("./work.vault");
    expect(result.command).toBe("vault");
    expect(result.subcommand).toBe("init");
  });

  test("parses get command with entry id", () => {
    const result = parseArgs(["get", "abc123"]);
    expect(result.command).toBe("get");
    expect(result.args).toEqual(["abc123"]);
  });
});
