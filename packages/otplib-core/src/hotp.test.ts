import { testSuiteHOTP } from '@tests/suite/hotp';
import { runOptionValidator } from '@tests/utils';
import { HashAlgorithms } from './utils';
import { HOTPOptions, hotpOptionsValidator, HOTP } from './hotp';

testSuiteHOTP<HOTP>('hotp', HOTP);

describe('hotpOptionsValidator', (): void => {
  const createDigest = jest.fn();
  const createHmacKey = jest.fn();

  test(`missing options.createDigest, should throw error`, (): void => {
    const result = runOptionValidator<HOTPOptions>(hotpOptionsValidator, {});

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.createDigest');
  });

  test(`missing options.createHmacKey, should throw error`, (): void => {
    const result = runOptionValidator<HOTPOptions>(hotpOptionsValidator, {
      createDigest
    });

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.createHmacKey');
  });

  test(`missing options.digits, should throw error`, (): void => {
    const result = runOptionValidator<HOTPOptions>(hotpOptionsValidator, {
      createDigest,
      createHmacKey
    });

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.digits');
  });
  test(`missing options.algorithm, should throw error`, (): void => {
    const result = runOptionValidator<HOTPOptions>(hotpOptionsValidator, {
      createDigest,
      createHmacKey,
      digits: 6
    });

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.algorithm');
  });

  test(`missing options.encoding, should throw error`, (): void => {
    const result = runOptionValidator<HOTPOptions>(hotpOptionsValidator, {
      createDigest,
      createHmacKey,
      digits: 6,
      algorithm: HashAlgorithms.SHA1
    });

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.encoding');
  });
});
