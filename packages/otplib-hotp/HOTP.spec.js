import * as core from 'otplib-core';
import HOTP from './HOTP';

describe('HOTP', () => {
  let lib;

  beforeEach(() => {
    lib = new HOTP();
  });

  it('exposes the class as a prototype', () => {
    expect(lib.HOTP).toEqual(HOTP);
  });

  it('should have expected default options', () => {
    const options = lib.options;
    expect(options).toEqual({});
  });

  it('defaultOptions getter returns expected result', () => {
    const options = lib.defaultOptions;
    expect(options).toEqual({});
  });

  it('options setter / getter should work', () => {
    const prev = lib.options;
    const newOptions = {
      test: 'value'
    };
    lib.options = newOptions;

    expect(prev).not.toEqual(lib.options);
    expect(lib.options).toEqual(Object.assign({}, prev, newOptions));
  });

  it('options setter should take in null ', () => {
    const prev = lib.options;
    lib.options = null;
    expect(prev).toEqual(lib.options);
  });

  it('options setter should take in void 0 ', () => {
    const prev = lib.options;
    lib.options = void 0;
    expect(prev).toEqual(lib.options);
  });

  it('method: resetOptions - should return options to defaults', () => {
    lib.options = {
      test: 'value'
    };
    expect(lib.options).toEqual({ test: 'value' });

    lib.resetOptions();
    expect(lib.options).toEqual({});
  });

  it('method: generate', () => {
    methodExpectation('generate', 'hotpToken');
  });

  it('method: generate => hotpToken ', () => {
    methodExpectationWithOptions('generate', 'hotpToken', [
      'secret',
      'counter'
    ]);
  });

  it('method: check', () => {
    methodExpectation('check', 'hotpCheck');
  });

  it('method: check => hotpCheck ', () => {
    methodExpectationWithOptions('check', 'hotpCheck', [
      'token',
      'secret',
      'counter'
    ]);
  });

  it('method: verify', () => {
    methodExpectation('verify', 'hotpCheck');
  });

  it('method: verify return false when not an object', () => {
    const result = lib.verify('string');
    expect(result).toBe(false);
  });

  it('method: verify return false when null', () => {
    const result = lib.verify(null);
    expect(result).toBe(false);
  });

  it('method: verify return false when undefined', () => {
    const result = lib.verify();
    expect(result).toBe(false);
  });

  it('method: verify calls check', () => {
    const spy = jest.spyOn(lib, 'check');

    lib.verify({
      token: 'token',
      secret: 'secret',
      counter: 'counter'
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('token', 'secret', 'counter');
  });

  function methodExpectation(methodName, coreName) {
    jest.spyOn(core, coreName).mockImplementation(() => 'result');
    expect(typeof lib[methodName] === 'function').toBe(true);
    expect(() => lib[methodName]()).not.toThrow(Error);
  }

  function methodExpectationWithOptions(methodName, coreName, args) {
    const spy = jest.spyOn(core, coreName).mockImplementation(() => 'result');

    lib[methodName](...args);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(...args, lib.optionsAll);
  }
});
