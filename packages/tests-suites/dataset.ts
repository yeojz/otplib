import { HOTP, TOTP, Authenticator } from 'otplib-core';
import * as rfc6238 from 'tests-data/rfc6238';
import * as rfc4226 from 'tests-data/rfc4226';
import * as dataAuthenticator from 'tests-data/authenticator';
import { HOTPAsync } from 'otplib-hotp-async';
import { TOTPAsync } from 'otplib-totp-async';
import { AuthenticatorAsync } from 'otplib-core-async';

export function rfcTestSuiteHOTP(name: string, hotp: HOTP | HOTPAsync): void {
  const { tokens, secret, digests } = rfc4226;

  beforeEach((): void => {
    hotp.resetOptions();
  });

  describe(`(${name}) RFC4226`, (): void => {
    tokens.forEach((token: string, counter: number): void => {
      test(`given counter (${counter}) and secret, expect token to be (${token}) `, async (): Promise<
        void
      > => {
        const result = await hotp.check(token, secret, counter);
        expect(result).toBe(true);
      });
    });

    digests.forEach((digest: string, counter: number): void => {
      test(`given digest, should receive expected token`, async (): Promise<
        void
      > => {
        hotp.options = { digest };

        const result = await hotp.check(tokens[counter], secret, counter);
        expect(result).toBe(true);
      });
    });
  });
}

export function rfcTestSuiteTOTP(name: string, totp: TOTP | TOTPAsync): void {
  const { table, secret } = rfc6238;

  beforeEach((): void => {
    totp.resetOptions();
  });

  describe(`(${name}) RFC6238`, (): void => {
    table.forEach((row): void => {
      const id = `algorithm (${row.algorithm}) and epoch (${row.epoch})`;

      test(`given ${id}, should receive token (${row.token})`, async (): Promise<
        void
      > => {
        totp.options = {
          epoch: row.epoch * 1000,
          algorithm: row.algorithm,
          digits: 8
        };

        const result = await totp.check(row.token, secret);
        expect(result).toBe(true);
      });
    });
  });
}

export function dataTestSuiteAuthenticator(
  name: string,
  authenticator: Authenticator | AuthenticatorAsync
): void {
  const { table, deltaTable } = dataAuthenticator;

  beforeEach((): void => {
    authenticator.resetOptions();
  });

  describe(`(${name}) Authenticator dataset`, (): void => {
    table.forEach((entry): void => {
      test(`given epoch (${entry.epoch}) and secret, should receive expected token ${entry.token}`, async (): Promise<
        void
      > => {
        authenticator.options = {
          epoch: entry.epoch
        };
        const result = await authenticator.generate(entry.secret);
        expect(result).toBe(entry.token);
      });
    });

    deltaTable.rows.forEach(([token, delta]): void => {
      test(`given window (2), token (${token}), should return delta (${delta})`, async (): Promise<
        void
      > => {
        authenticator.options = {
          epoch: deltaTable.epoch,
          window: 2
        };
        const result = await authenticator.checkDelta(token, deltaTable.secret);
        expect(result).toEqual(delta);
      });

      test(`given window ([2, 2]), token (${token}), should return delta (${delta})`, async (): Promise<
        void
      > => {
        authenticator.options = {
          epoch: deltaTable.epoch,
          window: [2, 2]
        };
        const result = await authenticator.checkDelta(token, deltaTable.secret);
        expect(result).toEqual(delta);
      });
    });
  });
}
