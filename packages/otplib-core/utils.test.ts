import { KeyURIOptions, Strategy, keyuri, HashAlgorithms } from './utils';

describe('keyuri', (): void => {
  const common: KeyURIOptions = {
    label: 'test label',
    secret: 'testsecret',
    type: Strategy.TOTP,
    user: 'test user'
  };

  const hotpPrefix = 'otpauth://hotp/';
  const totpPrefix = 'otpauth://totp/';
  const commonPrefix = 'test%20label:test%20user?secret=testsecret';

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

    expect(result).toEqual(`${hotpPrefix}${commonPrefix}&counter=1`);
  });

  test('totp - should not return counter', (): void => {
    const result = keyuri({
      ...common,
      counter: 1
    });

    expect(result).toEqual(`${totpPrefix}${commonPrefix}`);
  });

  test('hotp - should not return step', (): void => {
    const result = keyuri({
      ...common,
      type: Strategy.HOTP,
      counter: 1,
      step: 30
    });

    expect(result).toEqual(`${hotpPrefix}${commonPrefix}&counter=1`);
  });

  test('totp - should return step', (): void => {
    const result = keyuri({
      ...common,
      step: 30
    });

    expect(result).toEqual(`${totpPrefix}${commonPrefix}&period=30`);
  });

  test('should return digits', (): void => {
    const result = keyuri({
      ...common,
      digits: 6
    });

    expect(result).toEqual(`${totpPrefix}${commonPrefix}&digits=6`);
  });

  test('should return algorithm', (): void => {
    const result = keyuri({
      ...common,
      algorithm: HashAlgorithms.SHA1
    });

    expect(result).toEqual(`${totpPrefix}${commonPrefix}&algorithm=SHA1`);
  });

  test('should return issuer', (): void => {
    const result = keyuri({
      ...common,
      issuer: 'test issuer'
    });

    expect(result).toEqual(`${totpPrefix}${commonPrefix}&issuer=test%20issuer`);
  });
});
