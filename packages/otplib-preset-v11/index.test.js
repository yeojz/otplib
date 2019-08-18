import * as rfc4226 from 'tests-data/rfc4226';
import * as rfc6238 from 'tests-data/rfc6238';
import { hotp, totp, authenticator } from './index';
import { HOTP, TOTP, Authenticator } from './v11';

let originalConsoleWarn;

beforeAll(() => {
  originalConsoleWarn = console.warn;
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});

test('constructor names should not change', () => {
  expect(hotp.constructor.name).toEqual('HOTP');
  expect(totp.constructor.name).toEqual('TOTP');
  expect(authenticator.constructor.name).toEqual('Authenticator');
});

test('exposes the class as a prototype', () => {
  expect(hotp.HOTP).toEqual(HOTP);
  expect(totp.TOTP).toEqual(TOTP);
  expect(authenticator.Authenticator).toEqual(Authenticator);
});

test('should expose an instance of class', () => {
  expect(hotp).toBeInstanceOf(HOTP);
  expect(totp).toBeInstanceOf(TOTP);
  expect(authenticator).toBeInstanceOf(Authenticator);
});

test('method: getClass returns the class', () => {
  expect(hotp.getClass()).toEqual(HOTP);
  expect(totp.getClass()).toEqual(TOTP);
  expect(authenticator.getClass()).toEqual(Authenticator);
});

test('optionsAll returns all options', () => {
  expect(hotp.optionsAll).toEqual(hotp.allOptions());
});

describe('HOTP', () => {
  let lib;

  beforeEach(() => {
    lib = new HOTP();
  });

  test('should have expected default options', () => {
    const options = lib.options;
    expect(options).toEqual({});
  });

  test('defaultOptions getter returns expected result', () => {
    lib.defaultOptions = {
      test: 'me'
    };

    const options = lib.defaultOptions;
    expect(options).toEqual({ test: 'me' });
  });

  test('options setter / getter should work', () => {
    const prev = lib.options;
    const newOptions = {
      test: 'value'
    };
    lib.options = newOptions;

    expect(prev).not.toEqual(lib.options);
    expect(lib.options).toEqual(Object.assign({}, prev, newOptions));
  });

  test('options setter should take in null ', () => {
    const prev = lib.options;
    lib.options = null;
    expect(prev).toEqual(lib.options);
  });

  test('options setter should take in void 0 ', () => {
    const prev = lib.options;
    lib.options = void 0;
    expect(prev).toEqual(lib.options);
  });

  test('defaultOptions setter should take in null ', () => {
    const prev = lib.defaultOptions;
    lib.defaultOptions = null;
    expect(prev).toEqual(lib.defaultOptions);
  });

  test('defaultOptions setter should take in void 0 ', () => {
    const prev = lib.defaultOptions;
    lib.defaultOptions = void 0;
    expect(prev).toEqual(lib.defaultOptions);
  });

  test('method: resetOptions - should return options to defaults', () => {
    lib.options = {
      test: 'value'
    };
    lib.defaultOptions = {
      test2: 'value'
    };

    expect(lib.options).toEqual({ test: 'value', test2: 'value' });

    lib.resetOptions();
    expect(lib.options).toEqual({ test2: 'value' });
  });

  test('method: verify return false when not an object', () => {
    const result = lib.verify('string');
    expect(result).toBe(false);
  });

  test('method: verify return false when null', () => {
    const result = lib.verify(null);
    expect(result).toBe(false);
  });

  test('method: verify return false when undefined', () => {
    const result = lib.verify();
    expect(result).toBe(false);
  });

  test('method verify returns false when super class errors', () => {
    expect(hotp.verify({ token: 123, secret: 12142, counter: null })).toBe(
      false
    );
  });
});

describe('HOTP - RFC 4226', () => {
  const { tokens, secret } = rfc4226;

  tokens.forEach((token, counter) => {
    test(`[${counter}] otplib.hotp`, () => {
      expect(hotp.verify({ token, secret, counter })).toBe(true);
    });
  });
});

describe('TOTP', () => {
  let lib;

  beforeEach(() => {
    lib = new TOTP();
  });

  test('should have expected default options', () => {
    const lib = new TOTP();

    expect(lib.options).toEqual({
      step: 30,
      window: 0
    });
  });

  test('method: verify return false when not an object', () => {
    const result = lib.verify('string');
    expect(result).toBe(false);
  });

  test('method: verify return false when null', () => {
    const result = lib.verify(null);
    expect(result).toBe(false);
  });

  test('method: verify return false when undefined', () => {
    const result = lib.verify();
    expect(result).toBe(false);
  });
});

describe('TOTP - RFC 6238', () => {
  const { table, secret } = rfc6238;

  table.forEach(row => {
    const id = `${row.algorithm} / ${row.epoch}`;

    test(`[${id}] totp`, () => {
      totp.options = {
        epoch: row.epoch,
        algorithm: row.algorithm,
        digits: 8
      };

      expect(totp.check(row.token, secret)).toBe(true);
    });
  });
});

describe('Authenticator', () => {
  [
    {
      epoch: 1565103854545,
      secret: 'NBCC6NZLM5DU4L2HMF3HS4DPNYYHK32R',
      token: '566155'
    },
    {
      secret: 'NBCC6NZLM5DU4L2HMF3HS4DPNYYHK32R',
      epoch: 1565103878581,
      token: '522154'
    },
    {
      secret: 'MNWGYTSQMR4UG3ZRJ5VUQUTCGFTVMT3W',
      epoch: 1565103903110,
      token: '540849'
    }
  ].forEach(entry => {
    test(`should return expected token - ${entry.token}`, () => {
      const instance = authenticator.clone();
      instance.options = { epoch: entry.epoch };
      expect(instance.check(entry.token, entry.secret)).toBe(true);
    });
  });
});
