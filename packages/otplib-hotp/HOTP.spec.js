import * as core from 'otplib-core';
import HOTP from './HOTP';

describe('HOTP', function () {
  let lib;

  beforeEach(() => {
    lib = new HOTP();
  });

  it('exposes the class as a prototype', function () {
    expect(lib.HOTP).toEqual(HOTP);
  });

  it('should have expected default options', function () {
    const options = lib.options;
    expect(options).toEqual({});
  });

  it('defaultOptions getter returns expected result', function () {
    const options = lib.defaultOptions;
    expect(options).toEqual({});
  });

  it('options setter / getter should work', function () {
    const prev = lib.options;
    const newOptions = {
      test: 'value'
    }
    lib.options = newOptions;

    expect(prev).not.toEqual(lib.options);
    expect(lib.options).toEqual(Object.assign({}, prev, newOptions));
  });

  it('options setter should take in null ', function () {
    const prev = lib.options;
    lib.options = null;
    expect(prev).toEqual(lib.options);
  });

  it('options setter should take in void 0 ', function () {
    const prev = lib.options;
    lib.options = void 0;
    expect(prev).toEqual(lib.options);
  });

  it('method: resetOptions - should return options to defaults', function () {
    lib.options = {
      test: 'value'
    }
    expect(lib.options).toEqual({ test: 'value'});

    lib.resetOptions();
    expect(lib.options).toEqual({});
  });

  it('method: generate', function () {
    methodExpectation('generate', 'hotpToken');
  });

  it('method: generate => hotpToken ', function () {
    methodExpectationWithOptions('generate', 'hotpToken', [
      'secret',
      'counter'
    ]);
  });

  it('method: check', function () {
    methodExpectation('check', 'hotpCheck');
  });

  it('method: check => hotpCheck ', function () {
    methodExpectationWithOptions('check', 'hotpCheck', [
      'token',
      'secret',
      'counter'
    ]);
  });

  it('method: verify', function () {
    methodExpectation('verify', 'hotpCheck');
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
      secret: 'secret',
      counter: 'counter',
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('token', 'secret', 'counter');
  });

  function methodExpectation(methodName, coreName) {
    jest.spyOn(core, coreName)
      .mockImplementation(() => 'result');
    expect(typeof lib[methodName] === 'function').toBe(true);
    expect(() => lib[methodName]()).not.toThrow(Error);
  }

  function methodExpectationWithOptions(methodName, coreName, args) {
    const spy = jest.spyOn(core, coreName)
      .mockImplementation(() => 'result');

    lib[methodName](...args);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(...args, lib.options)
  }
});
