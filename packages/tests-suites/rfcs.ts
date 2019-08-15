import {
  HashAlgorithms,
  KeyEncodings,
  HOTP,
  TOTP,
  hotpCounter,
  totpCounter
} from 'otplib-core';

import * as rfc6238 from 'tests-data/rfc6238';
import * as rfc4226 from 'tests-data/rfc4226';

interface HOTPTestSuiteOptions {
  hotp: HOTP;
}

export function hotpTestSuite(name: string, opt: HOTPTestSuiteOptions): void {
  const { tokens, secret, digests } = rfc4226;
  const { hotp } = opt;

  const { createDigest, createHmacKey } = hotp.allOptions();

  describe(`(${name}) RFC4226`, (): void => {
    tokens.forEach((token: string, counter: number): void => {
      test(`given counter (${counter}) and secret, expect token to be (${token}) `, (): void => {
        expect(hotp.check(token, secret, counter)).toBe(true);
      });
    });

    digests.forEach((digest: string, counter: number): void => {
      test(`given counter (${counter}), should recieve expected digest`, (): void => {
        const result = createDigest(
          HashAlgorithms.SHA1,
          createHmacKey(HashAlgorithms.SHA1, secret, KeyEncodings.ASCII),
          hotpCounter(counter)
        );

        expect(result).toBe(digest);
      });
    });
  });
}

interface TOTPTestSuiteOptions {
  totp: TOTP;
}

export function totpTestSuite(name: string, opt: TOTPTestSuiteOptions): void {
  const { totp } = opt;
  const { table, secret, step } = rfc6238;

  function runTable(fn: (id: string, row: rfc6238.RowData) => void): void {
    table.forEach((row: rfc6238.RowData): void => {
      const id = `algorithm (${row.algorithm}) and epoch (${row.epoch})`;
      fn(id, row);
    });
  }

  describe(`(${name}) RFC6238`, (): void => {
    runTable((id, row): void => {
      test(`given ${id}, should receive expected counter`, (): void => {
        const counter = hotpCounter(totpCounter(row.epoch * 1000, step));
        expect(counter.toUpperCase()).toBe(row.counter);
      });
    });

    runTable((id, row): void => {
      test(`given ${id}, should receive token (${row.token})`, (): void => {
        totp.options = {
          epoch: row.epoch * 1000,
          algorithm: row.algorithm,
          digits: 8
        };

        expect(totp.check(row.token, secret)).toBe(true);
      });
    });
  });
}
