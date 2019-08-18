import { KeyEncodings } from 'otplib-hotp';
import * as hotp from 'otplib-hotp/hotp';
import * as rfc6238 from 'tests-data/rfc6238';
import {
  TOTPOptions,
  totpOptionsValidator,
  TOTP,
  totpCreateHmacKey,
  totpCheckWithWindow,
  totpCounter
} from './totp';
import { runOptionValidator } from 'tests-suites/helpers';
import { testSuiteTOTP } from 'tests-suites/core-totp';

const secret = 'i6im0gc96j0mn00c';

testSuiteTOTP<TOTP>('totp', TOTP);

describe('RFC6238 - counter checks', (): void => {
  const { table, step } = rfc6238;

  table.forEach((row): void => {
    const id = `algorithm (${row.algorithm}) and epoch (${row.epoch})`;

    test(`given ${id}, should receive expected counter`, async (): Promise<
      void
    > => {
      const counter = hotp.hotpCounter(totpCounter(row.epoch * 1000, step));
      expect(counter.toUpperCase()).toBe(row.counter);
    });
  });
});

describe('totpCreateHmacKey', (): void => {
  test('should throw error for unsupported type', (): void => {
    expect((): void => {
      // @ts-ignore
      totpCreateHmacKey('', secret, KeyEncodings.ASCII);
    }).toThrow();
  });
});

describe('totpCheckWithWindow', (): void => {
  test('options.number - non-number / non-array', (): void => {
    expect((): void => {
      // @ts-ignore
      totpCheckWithWindow('123456', secret, { window: null });
    }).toThrow();
  });

  test('options.number - array of non-number will throw', (): void => {
    expect((): void => {
      // @ts-ignore
      totpCheckWithWindow('123456', secret, { window: ['test', 'me'] });
    }).toThrow();
  });
});

describe('totpOptionsValidator', (): void => {
  const hotpOptionsValidator = jest.spyOn(hotp, 'hotpOptionsValidator');

  afterAll((): void => {
    hotpOptionsValidator.mockReset();
  });

  test('invalid options.window, should throw error', (): void => {
    const result = runOptionValidator<TOTPOptions>(totpOptionsValidator, {});

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.window');
  });

  test('invalid options.window, array but non-number, should throw error', (): void => {
    const result = runOptionValidator<TOTPOptions>(totpOptionsValidator, {
      // @ts-ignore
      window: ['hi', ' me']
    });

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.window');
  });

  test('missing options.epoch, should throw error', (): void => {
    const result = runOptionValidator<TOTPOptions>(totpOptionsValidator, {
      window: 0
    });

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.epoch');
  });

  test('missing options.step, should throw error', (): void => {
    const result = runOptionValidator<TOTPOptions>(totpOptionsValidator, {
      epoch: Date.now(),
      window: 0
    });

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.step');
  });
});
