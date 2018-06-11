import * as core from 'otplib-core';
import TOTP from './TOTP';

describe('TOTP', () => {
  let lib;

  beforeEach(() => {
    lib = new TOTP();
  });

  it('exposes the class as a prototype', () => {
    expect(lib.TOTP).toEqual(TOTP);
  });

  it('method: getClass returns the class', () => {
    expect(lib.getClass()).toEqual(TOTP);
  });

  it('should have expected default options', () => {
    const options = lib.options;
    expect(options).toEqual({
      epoch: null,
      step: 30,
      window: 0
    });
  });

  it('method: generate', () => {
    methodExpectation('generate', 'totpToken');
  });

  it('method: generate => totpToken ', () => {
    methodExpectationWithOptions('generate', 'totpToken', ['secret']);
  });

  it('method: check', () => {
    methodExpectation('check', 'totpCheckWithWindow');
  });

  it('method: check => totpCheckWithWindow ', () => {
    methodExpectationWithOptions('check', 'totpCheckWithWindow', [
      'token',
      'secret'
    ]);
  });

  it('method: check calls checkDelta', () => {
    const spy = jest.spyOn(lib, 'checkDelta');

    lib.check('token', 'secret');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('token', 'secret');
  });

  it('method: checkDelta', () => {
    methodExpectation('checkDelta', 'totpCheckWithWindow');
  });

  it('method: checkDelta => totpCheckWithWindow ', () => {
    methodExpectationWithOptions('checkDelta', 'totpCheckWithWindow', [
      'token',
      'secret'
    ]);
  });

  it('method: verify', () => {
    methodExpectation('verify', 'totpCheckWithWindow');
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
      secret: 'secret'
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('token', 'secret');
  });

  function methodExpectation(methodName, coreName) {
    jest.spyOn(core, coreName).mockImplementation(() => 'result');

    expect(typeof lib[methodName] === 'function').toBe(true);
    expect(() => lib[methodName]()).not.toThrow(Error);
  }

  function methodExpectationWithOptions(methodName, coreName, args) {
    lib.options = { epoch: 1519995424045 };

    const spy = jest.spyOn(core, coreName).mockImplementation(() => 'result');

    lib[methodName](...args);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(...args, lib.optionsAll);
  }
});
