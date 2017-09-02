import * as utils from 'otplib-utils';
import Authenticator from './Authenticator';
import check from './check';
import decodeKey from './decodeKey';
import encodeKey from './encodeKey';
import keyuri from './keyuri';
import token from './token';

jest.mock('./check', () => jest.fn());
jest.mock('./decodeKey', () => jest.fn());
jest.mock('./encodeKey', () => jest.fn());
jest.mock('./keyuri', () => jest.fn());
jest.mock('./token', () => jest.fn());

describe('Authenticator', function () {
  let lib;
  const testValue = 'test';

  beforeEach(() => {
    lib = new Authenticator();
  });

  it('exposes the class as a prototype', function () {
    expect(lib.Authenticator).toEqual(Authenticator);
  });

  it('exposes authenticator functions as utils', function () {
    expect(Object.keys(lib.utils)).toEqual([
      'check',
      'decodeKey',
      'encodeKey',
      'keyuri',
      'token',
    ]);
  });

  it('should have expected default options', function () {
    const options = lib.options;
    expect(options).toEqual({
      encoding: 'hex',
      epoch: null,
      step: 30,
    });
  });

  it('method: encode => encodeKey', function () {
    methodExpectation('encode', encodeKey, [
      '123'
    ]);
  });

  it('method: decode => decodeKey', function () {
    methodExpectation('decode', decodeKey, [
      '123'
    ]);
  });

  it('method: keyuri => keyuri', function () {
    methodExpectation('keyuri', keyuri, [
      '123'
    ]);
  });

  it('method: generateSecret returns empty string on falsy len params', function () {
    expect(lib.generateSecret(0)).toBe('');
  });

  it('method: generateSecret should return an encoded secret', function () {
    const mocks = mockGenerateSecret();
    const result = lib.generateSecret(10);

    expect(mocks.secretKey).toHaveBeenCalledTimes(1);
    expect(mocks.secretKey).toHaveBeenCalledWith(10, lib.options);

    expect(encodeKey).toHaveBeenCalledTimes(1);
    expect(encodeKey).toHaveBeenCalledWith(mocks.secret);

    expect(result).toBe(testValue);
  });

  it('method: generateSecret should return empty string on null parms', function () {
    const mocks = mockGenerateSecret();
    const result = lib.generateSecret(null);
    expect(result).toBe('');
    expect(mocks.secretKey).toHaveBeenCalledTimes(0);
  });

  it('method: generateSecret should use default params on undefined params', function () {
    const mocks = mockGenerateSecret();
    const result = lib.generateSecret();
    expect(mocks.secretKey).toHaveBeenCalledTimes(1);
    expect(encodeKey).toHaveBeenCalledTimes(1);
    expect(result).toBe(testValue);
  });

  it('method: generate => token', function () {
    methodExpectationWithOptions('generate', token, [
      'secret'
    ]);
  });

  it('method: check => check', function () {
    methodExpectationWithOptions('check', check, [
      'token',
      'secret'
    ]);
  });

  function methodExpectation(methodName, mockFn, args) {
    mockFn.mockImplementation(() => testValue);

    const result = lib[methodName](...args);

    expect(result).toBe(testValue);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(...args);
  }

  function methodExpectationWithOptions(methodName, mockFn, args) {
    mockFn.mockImplementation(() => testValue);

    const result = lib[methodName](...args);

    expect(result).toBe(testValue);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(...args, lib.options)
  }

  function mockGenerateSecret() {
    const secret = '1234567890';
    const secretKey = jest.spyOn(utils, 'secretKey')
      .mockImplementation(() => secret);

    encodeKey.mockImplementation(() => testValue);

    return {
      secret,
      secretKey
    }
  }
});
