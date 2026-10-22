/**
 * Distribution tests for CommonJS without require() of ES modules (Node.js)
 *
 * @otplib/totp, @otplib/plugin-crypto-node and @otplib/plugin-base32-rfc have no ESM-only
 * dependencies, so together they must work from require() even when the runtime cannot
 * require() ES modules.
 */

import { execFileSync } from "child_process";
import { readFileSync } from "fs";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

import { describe, it, expect } from "vitest";
import { Rfc4648Base32Plugin } from "@otplib/plugin-base32-rfc";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
import { RFC6238_VECTORS } from "@repo/testing";

const require = createRequire(import.meta.url);
const testsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(testsDir, "../..");

/** Run code as CommonJS in a Node.js process that cannot require() ES modules. */
function runWithoutRequireESM(script: string): string {
  return execFileSync(
    process.execPath,
    ["--no-experimental-require-module", "--input-type=commonjs", "-e", script],
    { cwd: testsDir, encoding: "utf8" },
  );
}

/** The first javascript code block after `heading` in a Markdown file. */
function codeBlockAfter(file: string, heading: string): string {
  const markdown = readFileSync(path.resolve(rootDir, file), "utf8");
  const start = markdown.indexOf(heading);
  expect(start, `${heading} in ${file}`).toBeGreaterThanOrEqual(0);
  const block = /```javascript\n([\s\S]*?)```/.exec(markdown.slice(start));
  expect(block, `javascript block after ${heading} in ${file}`).not.toBeNull();
  return block![1];
}

describe("CommonJS without require() of ES modules", () => {
  it("generates and verifies a TOTP with @otplib/totp, plugin-crypto-node and plugin-base32-rfc", () => {
    const paths = {
      core: require.resolve("@otplib/core"),
      totp: require.resolve("@otplib/totp"),
      crypto: require.resolve("@otplib/plugin-crypto-node"),
      base32: require.resolve("@otplib/plugin-base32-rfc"),
    };
    const script = `
      const { generateSecret } = require(${JSON.stringify(paths.core)});
      const { generate, verify } = require(${JSON.stringify(paths.totp)});
      const { crypto } = require(${JSON.stringify(paths.crypto)});
      const { base32 } = require(${JSON.stringify(paths.base32)});

      (async () => {
        const secret = generateSecret({ crypto, base32 });
        const token = await generate({ secret, crypto, base32 });
        const result = await verify({ secret, token, crypto, base32 });
        console.log(JSON.stringify({ base32: base32.name, valid: result.valid }));
      })();
    `;

    expect(JSON.parse(runWithoutRequireESM(script))).toEqual({ base32: "rfc4648", valid: true });
  });

  it("generates the RFC 6238 SHA-1 token from an existing Base32 secret", () => {
    // Base32 for the RFC 6238 SHA-1 secret "12345678901234567890", as an authenticator stores it.
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    const { epoch, expected } = RFC6238_VECTORS.sha1.vectors[0];
    const script = `
      const { generate } = require("@otplib/totp");
      const { crypto } = require("@otplib/plugin-crypto-node");
      const { base32 } = require("@otplib/plugin-base32-rfc");

      generate({ secret: ${JSON.stringify(secret)}, epoch: ${epoch}, digits: 8, crypto, base32 })
        .then((token) => console.log(token));
    `;

    expect(runWithoutRequireESM(script).trim()).toBe(expected);
  });

  // The documented recipes must run as written in a CommonJS file.
  it.each([
    {
      file: "packages/plugin-base32-rfc/README.md",
      heading: "### CommonJS without require() of ES modules",
    },
    { file: "apps/docs/guide/runtime-compatibility.md", heading: "## CommonJS {#commonjs}" },
  ])("runs the recipe in $file", ({ file, heading }) => {
    expect(runWithoutRequireESM(codeBlockAfter(file, heading)).trim()).toBe("true");
  });
});

describe("Rfc4648Base32Plugin distribution", () => {
  const rfc4648 = new Rfc4648Base32Plugin();
  const scure = new ScureBase32Plugin();

  it("decodes authenticator secrets like ScureBase32Plugin", () => {
    for (const secret of ["GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", "jbswy3dpehpk3pxp", "ME======"]) {
      expect(rfc4648.decode(secret)).toEqual(scure.decode(secret));
    }
  });

  it("encodes like ScureBase32Plugin", () => {
    const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x01]);
    expect(rfc4648.encode(bytes)).toBe(scure.encode(bytes));
    expect(rfc4648.encode(bytes, { padding: true })).toBe(scure.encode(bytes, { padding: true }));
  });
});
