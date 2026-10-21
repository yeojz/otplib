/**
 * Distribution tests for the CommonJS entry points (Node.js)
 *
 * Runs require() in a child process, because Vitest loads test files as ES modules and would
 * otherwise resolve the packages' ESM builds.
 */

import { execFileSync } from "child_process";
import { createRequire } from "module";

import { describe, it, expect } from "vitest";

const require = createRequire(import.meta.url);

function exportsFromRequire(specifier: string): string[] {
  const script = `console.log(JSON.stringify(Object.keys(require(${JSON.stringify(require.resolve(specifier))}))));`;
  const output = execFileSync(process.execPath, ["-e", script], { encoding: "utf8" });
  return JSON.parse(output) as string[];
}

describe("CommonJS entry points", () => {
  it.each([
    { specifier: "otplib", exportName: "generate" },
    { specifier: "@otplib/plugin-base32-scure", exportName: "base32" },
    { specifier: "@otplib/plugin-crypto-noble", exportName: "crypto" },
  ])("loads $specifier with require()", ({ specifier, exportName }) => {
    expect(exportsFromRequire(specifier)).toContain(exportName);
  });
});
