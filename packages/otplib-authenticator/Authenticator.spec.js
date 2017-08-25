import * as core from 'otplib-core';
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

  it('method: encode => encodeKey', function () {
    methodPassthrough('encode', encodeKey, [
      '123'
    ]);
  });

  it('method: decode => decodeKey', function () {
    methodPassthrough('decode', decodeKey, [
      '123'
    ]);
  });

  it('method: keyuri => keyuri', function () {
    methodPassthrough('keyuri', keyuri, [
      '123'
    ]);
  });

  it('method: generate => token', function () {
    methodPassthroughWithOptions('generate', token, [
      'secret'
    ]);
  });

  it('method: check => check', function () {
    methodPassthroughWithOptions('check', check, [
      'token',
      'secret'
    ]);
  });

  function methodPassthrough(methodName, mockFn, args) {
    mockFn.mockImplementation(() => testValue);

    const result = lib[methodName](...args);

    expect(result).toEqual(testValue);
    expect(mockFn.mock.calls[0]).toEqual([...args])
  }

  function methodPassthroughWithOptions(methodName, mockFn, args) {
    mockFn.mockImplementation(() => testValue);

    const result = lib[methodName](...args);

    expect(result).toEqual(testValue);
    expect(mockFn.mock.calls[0]).toEqual([...args, lib.options])
  }
});
