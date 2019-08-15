import { KeyURIOptions, Strategy, keyuri, HashAlgorithms } from './utils';

describe('keyuri', (): void => {
  const common: KeyURIOptions = {
    accountName: 'test user',
    issuer: 'test label',
    secret: 'testsecret',
    type: Strategy.TOTP
  };

  const hotpPrefix = 'otpauth://hotp/';
  const totpPrefix = 'otpauth://totp/';
  const commonPrefix = 'test%20label:test%20user?secret=testsecret';
  const issuerQuery = '&issuer=test%20label';

  test('should throw error without a type', (): void => {
    const fn = (): void => {
      // @ts-ignore
      keyuri({});
    };

    expect(fn).toThrow();
  });

  test('should throw if type is hotp an counter not given', (): void => {
    const fn = (): void => {
      // @ts-ignore
      keyuri({
        type: Strategy.HOTP
      });
    };

    expect(fn).toThrow();
  });

  test('should throw if type is hotp an counter is not a number', (): void => {
    const fn = (): void => {
      keyuri({
        type: Strategy.HOTP,
        // @ts-ignore
        counter: 'not-a-number'
      });
    };

    expect(fn).toThrow();
  });

  test('hotp - should return counter', (): void => {
    const result = keyuri({
      ...common,
      type: Strategy.HOTP,
      counter: 1
    });

    expect(result).toEqual(
      `${hotpPrefix}${commonPrefix}&counter=1${issuerQuery}`
    );
  });

  test('totp - should not return counter', (): void => {
    const result = keyuri({
      ...common,
      counter: 1
    });

    expect(result).toEqual(`${totpPrefix}${commonPrefix}${issuerQuery}`);
  });

  test('hotp - should not return step', (): void => {
    const result = keyuri({
      ...common,
      type: Strategy.HOTP,
      counter: 1,
      step: 30
    });

    expect(result).toEqual(
      `${hotpPrefix}${commonPrefix}&counter=1${issuerQuery}`
    );
  });

  test('totp - should return step', (): void => {
    const result = keyuri({
      ...common,
      step: 30
    });

    expect(result).toEqual(
      `${totpPrefix}${commonPrefix}&period=30${issuerQuery}`
    );
  });

  test('should return digits', (): void => {
    const result = keyuri({
      ...common,
      digits: 6
    });

    expect(result).toEqual(
      `${totpPrefix}${commonPrefix}&digits=6${issuerQuery}`
    );
  });

  test('should return algorithm', (): void => {
    const result = keyuri({
      ...common,
      algorithm: HashAlgorithms.SHA1
    });

    expect(result).toEqual(
      `${totpPrefix}${commonPrefix}&algorithm=SHA1${issuerQuery}`
    );
  });

  test('should not return issuer but account name', (): void => {
    const result = keyuri({
      accountName: 'test user',
      secret: 'testsecret',
      type: Strategy.TOTP
    });

    expect(result).toEqual(
      `${totpPrefix}test%20user:test%20user?secret=testsecret`
    );
  });
});
