/**
 * Parity with @otplib/plugin-base32-scure
 *
 * Rfc4648Base32Plugin is a drop-in replacement for ScureBase32Plugin: it must encode the same
 * output and accept and reject the same strings, with the same error messages. These tests are
 * part of the compatibility contract, so they run with the package's unit tests.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { ScureBase32Plugin } from "@otplib/plugin-base32-scure";

import { Rfc4648Base32Plugin } from "./index.js";

import type { Base32Plugin } from "@otplib/core";

const rfc4648 = new Rfc4648Base32Plugin();
const scure = new ScureBase32Plugin();

type DecodeOutcome = { ok: true; bytes: Uint8Array } | { ok: false; message: string };

function decodeOutcome(plugin: Base32Plugin, input: string): DecodeOutcome {
  try {
    return { ok: true, bytes: plugin.decode(input) };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

/** Every string up to `maxLength` letters long built from `letters`. */
function* allStrings(letters: string[], maxLength: number): Generator<string> {
  let current = [""];
  yield "";
  for (let length = 1; length <= maxLength; length++) {
    const next: string[] = [];
    for (const prefix of current) {
      for (const letter of letters) {
        next.push(prefix + letter);
      }
    }
    yield* next;
    current = next;
  }
}

describe("Rfc4648Base32Plugin parity with ScureBase32Plugin", () => {
  it("should encode the same output", () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 0, maxLength: 1024 }),
        fc.boolean(),
        (bytes, padding) => {
          expect(rfc4648.encode(bytes, { padding })).toBe(scure.encode(bytes, { padding }));
        },
      ),
    );
  });

  it("should accept and reject the same random strings", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          // Mostly valid letters, padding and case, to reach the length and padding checks
          fc.stringMatching(/^[A-Za-z2-7=]{0,40}$/),
          fc.stringMatching(/^[A-Z2-7]{0,40}={0,8}$/),
        ),
        (input) => {
          expect(decodeOutcome(rfc4648, input)).toEqual(decodeOutcome(scure, input));
        },
      ),
      { numRuns: 2000 },
    );
  });

  it("should accept and reject the same short strings", () => {
    // Letters with zero and non-zero low bits, lowercase, padding and an invalid letter, in
    // every combination up to one full 8-letter block minus two (55,987 strings).
    const letters = ["A", "Q", "7", "a", "=", "1"];
    for (const input of allStrings(letters, 6)) {
      expect(decodeOutcome(rfc4648, input), input).toEqual(decodeOutcome(scure, input));
    }
  });
});
