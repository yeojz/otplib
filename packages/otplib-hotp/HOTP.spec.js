import * as core from 'otplib-core';
import { resetObjectMocks } from 'tests/helpers';
import HOTP from './HOTP';

jest.mock('otplib-core');

describe('HOTP', () => {
  let lib;

  function mockOptions() {
    core.hotpOptions.mockImplementation(() => ({
      secret: 'secret'
    }));
  }

  beforeEach(() => {
    lib = new HOTP();
    resetObjectMocks(core);
  });

  it('exposes the class as a prototype', () => {
    expect(lib.HOTP).toEqual(HOTP);
  });

  it('method: getClass returns the class', () => {
    expect(lib.getClass()).toEqual(HOTP);
  });

  it('should have expected default options', () => {
    const options = lib.options;
    expect(options).toEqual({});
  });

  it('defaultOptions getter returns expected result', () => {
    lib.defaultOptions = {
      test: 'me'
    };
    const options = lib.defaultOptions;
    expect(options).toEqual({ test: 'me' });
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

  it('defaultOptions setter should take in null ', () => {
    const prev = lib.defaultOptions;
    lib.defaultOptions = null;
    expect(prev).toEqual(lib.defaultOptions);
  });

  it('defaultOptions setter should take in void 0 ', () => {
    const prev = lib.defaultOptions;
    lib.defaultOptions = void 0;
    expect(prev).toEqual(lib.defaultOptions);
  });

  it('method: resetOptions - should return options to defaults', () => {
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

  it('method: generate', () => {
    mockOptions();

    methodExpectation('generate', 'hotpToken');
  });

  it('method: generate => hotpToken ', () => {
    methodExpectationWithOptions('generate', 'hotpToken', [
      'secret',
      'counter'
    ]);
  });

  it('method: check', () => {
    mockOptions();

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
    core[coreName].mockImplementation(() => 'result');

    expect(typeof lib[methodName] === 'function').toBe(true);
    expect(() => lib[methodName]()).not.toThrow(Error);
  }

  function methodExpectationWithOptions(methodName, coreName, args) {
    core[coreName].mockImplementation(() => 'result');

    lib[methodName](...args);
    expect(core[coreName]).toHaveBeenCalledTimes(1);
    expect(core[coreName]).toHaveBeenCalledWith(...args, lib.optionsAll);
  }
});
