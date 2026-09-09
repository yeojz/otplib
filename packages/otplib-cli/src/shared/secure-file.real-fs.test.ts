import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { writeSecretFile } from "./secure-file.js";

// Deliberately does NOT mock node:fs — secure-file.test.ts verifies the call
// sequence against mocks, but that leaves the actual resulting permission
// bits (the entire point of the module) unverified. These tests exercise
// the real filesystem.
describe("secure-file (real fs)", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "otplib-secure-file-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test("creates a new file with 0600 permissions", () => {
    const filePath = path.join(dir, "secret");

    writeSecretFile(filePath, "content");

    expect(fs.readFileSync(filePath, "utf8")).toBe("content");
    expect(fs.statSync(filePath).mode & 0o777).toBe(0o600);
  });

  test("tightens an existing 0644 file to 0600 and overwrites its content", () => {
    const filePath = path.join(dir, "secret");
    fs.writeFileSync(filePath, "stale", { mode: 0o644 });
    expect(fs.statSync(filePath).mode & 0o777).toBe(0o644);

    writeSecretFile(filePath, "fresh");

    expect(fs.readFileSync(filePath, "utf8")).toBe("fresh");
    expect(fs.statSync(filePath).mode & 0o777).toBe(0o600);
  });

  test("appends to an existing file while keeping 0600 permissions", () => {
    const filePath = path.join(dir, "secret");
    fs.writeFileSync(filePath, "first\n", { mode: 0o644 });

    writeSecretFile(filePath, "second\n", "a");

    expect(fs.readFileSync(filePath, "utf8")).toBe("first\nsecond\n");
    expect(fs.statSync(filePath).mode & 0o777).toBe(0o600);
  });

  test("refuses to write through a symlink", () => {
    const targetPath = path.join(dir, "attacker-owned");
    fs.writeFileSync(targetPath, "untouched", { mode: 0o600 });
    const linkPath = path.join(dir, "secret");
    fs.symlinkSync(targetPath, linkPath);

    expect(() => writeSecretFile(linkPath, "content")).toThrow(/symlink/i);

    expect(fs.readFileSync(targetPath, "utf8")).toBe("untouched");
  });
});
