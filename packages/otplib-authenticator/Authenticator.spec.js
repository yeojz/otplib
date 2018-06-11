import * as utils from 'otplib-utils';
import Authenticator from './Authenticator';
import check from './check';
import checkDelta from './checkDelta';
import decodeKey from './decodeKey';
import encodeKey from './encodeKey';
import keyuri from './keyuri';
import token from './token';

jest.mock('./check', () => jest.fn());
jest.mock('./checkDelta', () => jest.fn());
jest.mock('./decodeKey', () => jest.fn());
jest.mock('./encodeKey', () => jest.fn());
jest.mock('./keyuri', () => jest.fn());
jest.mock('./token', () => jest.fn());

describe('Authenticator', () => {
  let lib;
  const testValue = 'test';

  beforeEach(() => {
    lib = new Authenticator();
  });

  it('exposes the class as a prototype', () => {
    expect(lib.Authenticator).toEqual(Authenticator);
  });

  it('method: getClass returns the class', () => {
    expect(lib.getClass()).toEqual(Authenticator);
  });

  it('exposes authenticator functions as utils', () => {
    expect(Object.keys(lib.utils)).toEqual([
      'check',
      'checkDelta',
      'decodeKey',
      'encodeKey',
      'keyuri',
      'token'
    ]);
  });

  it('should have expected default options', () => {
    const options = lib.options;
    expect(options).toEqual({
      encoding: 'hex',
      epoch: null,
      step: 30,
      window: 0
    });
  });

  it('method: encode => encodeKey', () => {
    methodExpectation('encode', encodeKey, ['123']);
  });

  it('method: decode => decodeKey', () => {
    methodExpectation('decode', decodeKey, ['123']);
  });

  it('method: keyuri => keyuri', () => {
    methodExpectation('keyuri', keyuri, ['123']);
  });

  it('method: generateSecret returns empty string on falsy len params', () => {
    expect(lib.generateSecret(0)).toBe('');
  });

  it('method: generateSecret should return an encoded secret', () => {
    const mocks = mockGenerateSecret();
    lib.options = { epoch: 1519995424045 };
    const result = lib.generateSecret(10);

    expect(mocks.secretKey).toHaveBeenCalledTimes(1);
    expect(mocks.secretKey).toHaveBeenCalledWith(10, lib.optionsAll);

    expect(encodeKey).toHaveBeenCalledTimes(1);
    expect(encodeKey).toHaveBeenCalledWith(mocks.secret);

    expect(result).toBe(testValue);
  });

  it('method: generateSecret should return empty string on null parms', () => {
    const mocks = mockGenerateSecret();
    const result = lib.generateSecret(null);
    expect(result).toBe('');
    expect(mocks.secretKey).toHaveBeenCalledTimes(0);
  });

  it('method: generateSecret should use default params on undefined params', () => {
    const mocks = mockGenerateSecret();
    const result = lib.generateSecret();
    expect(mocks.secretKey).toHaveBeenCalledTimes(1);
    expect(encodeKey).toHaveBeenCalledTimes(1);
    expect(result).toBe(testValue);
  });

  it('method: generate => token', () => {
    methodExpectationWithOptions('generate', token, ['secret']);
  });

  it('method: generate => token (fallback to secret in options)', () => {
    lib.options = { secret: 'option-secret' };
    methodExpectationWithOptions('generate', token, [null], ['option-secret']);
  });

  it('method: check => check', () => {
    methodExpectationWithOptions('check', check, ['token', 'secret']);
  });

  it('method: check => check (fallback to secret in options)', () => {
    lib.options = { secret: 'option-secret' };
    methodExpectationWithOptions(
      'check',
      check,
      ['token', null],
      ['token', 'option-secret']
    );
  });

  it('method: checkDelta => checkDelta', () => {
    methodExpectationWithOptions('checkDelta', checkDelta, ['token', 'secret']);
  });

  it('method: checkDelta => checkDelta (fallback to secret in options)', () => {
    lib.options = { secret: 'option-secret' };
    methodExpectationWithOptions(
      'checkDelta',
      checkDelta,
      ['token', null],
      ['token', 'option-secret']
    );
  });

  function methodExpectation(methodName, mockFn, args) {
    mockFn.mockImplementation(() => testValue);

    const result = lib[methodName](...args);

    expect(result).toBe(testValue);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(...args);
  }

  function methodExpectationWithOptions(
    methodName,
    mockFn,
    args,
    modifiedArgs
  ) {
    mockFn.mockImplementation(() => testValue);
    lib.options = { epoch: 1519995424045 };

    const result = lib[methodName](...args);
    const calledArgs = modifiedArgs || args;

    expect(result).toBe(testValue);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(...calledArgs, lib.optionsAll);
  }

  function mockGenerateSecret() {
    const secret = '1234567890';
    const secretKey = jest
      .spyOn(utils, 'secretKey')
      .mockImplementation(() => secret);

    encodeKey.mockImplementation(() => testValue);

    return {
      secret,
      secretKey
    };
  }
});
