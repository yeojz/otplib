import * as core from 'otplib-core';
import TOTP from './TOTP';

describe('TOTP', function () {
  let lib;

  beforeEach(() => {
    lib = new TOTP();
  });

  it('exposes the class as a prototype', function () {
    expect(lib.TOTP).toEqual(TOTP);
  });

  it('method: generate', function () {
    methodExpectation('generate', 'totpToken');
  });

  it('method: generate => totpToken ', function () {
    methodPassthroughWithOptions('generate', 'totpToken', [
      'secret'
    ]);
  });

  it('method: check', function () {
    methodExpectation('check', 'totpCheck');
  });

  it('method: check => totpCheck ', function () {
    methodPassthroughWithOptions('check', 'totpCheck', [
      'token',
      'secret'
    ]);
  });

  it('method: verify', function () {
    methodExpectation('verify', 'totpCheck');
  });

  it('method: verify return false when not an object', function () {
    const result = lib.verify('string');
    expect(result).toBe(false);
  });

  it('method: verify return false when null', function () {
    const result = lib.verify(null);
    expect(result).toBe(false);
  });

  it('method: verify return false when undefined', function () {
    const result = lib.verify();
    expect(result).toBe(false);
  });

  it('method: verify calls check', function () {
    const spy = jest.spyOn(lib, 'check');

    lib.verify({
      token: 'token',
      secret: 'secret'
    });

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]).toEqual(['token', 'secret'])
  });
  function methodExpectation(methodName, coreName) {
    jest.spyOn(core, coreName)
      .mockImplementation(() => 'result');

    expect(typeof lib[methodName] === 'function').toBe(true);
    expect(() => lib[methodName]()).not.toThrow(Error);
  }

  function methodPassthroughWithOptions(methodName, coreName, args) {
    const spy = jest.spyOn(core, coreName)
      .mockImplementation(() => 'result');

    lib[methodName](...args);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]).toEqual([...args, lib.options])
  }
});
