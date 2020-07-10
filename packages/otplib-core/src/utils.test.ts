/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { KeyURIOptions, Strategy, keyuri, HashAlgorithms, OTP } from './utils';

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
      `${totpPrefix}test%20user?secret=testsecret`
    );
  });
});

describe('OTP', (): void => {
  test('no arguments, should init without error', (): void => {
    expect((): OTP => new OTP()).not.toThrow();
  });

  test('null argument, should init without error', (): void => {
    expect((): void => {
      // @ts-ignore
      new OTP(null);
    }).not.toThrow();
  });

  test('should init default values which does not reset', (): void => {
    let instance = new OTP({});
    expect(instance.options).toEqual({});

    instance = new OTP({ digits: 100 });
    expect(instance.options).toEqual({ digits: 100 });

    instance.resetOptions();
    expect(instance.options).toEqual({ digits: 100 });
  });

  test('should set options which resets', (): void => {
    const instance = new OTP({});
    instance.options = { digits: 100 };
    expect(instance.options).toEqual({ digits: 100 });

    instance.resetOptions();
    expect(instance.options).toEqual({});
  });

  test('should not throw even when options given is null', (): void => {
    const instance = new OTP({});

    expect((): void => {
      // @ts-ignore
      instance.options = null;
    }).not.toThrow();

    expect(typeof instance.options).toBe('object');
  });

  test('calling create returns a new instance with new set of defaults', (): void => {
    const opt = {
      algorithm: HashAlgorithms.SHA256
    };

    const instance = new OTP(opt);
    expect(instance.options).toEqual(opt);

    const instance2 = instance.create();
    expect(instance2).toBeInstanceOf(OTP);
    expect(instance2.options).toEqual({});
  });

  test('calling clone returns a new instance with new set of defaults', (): void => {
    const opt = {
      algorithm: HashAlgorithms.SHA256
    };

    const instance = new OTP({});
    instance.options = opt;
    expect(instance.options).toEqual(opt);

    const instance2 = instance.clone();
    expect(instance2).toBeInstanceOf(OTP);
    expect(instance.options).toEqual(opt);

    const instance3 = instance.clone({ digits: 8 });
    expect(instance.options).toEqual(opt);
    expect(instance3.options).toEqual({ ...opt, digits: 8 });
  });

  test('allOptions should return options', (): void => {
    const instance = new OTP();
    expect(instance.allOptions()).toEqual(instance.options);
  });
});
