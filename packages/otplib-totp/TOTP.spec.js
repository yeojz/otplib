import * as core from 'otplib-core';
import { resetObjectMocks } from 'tests/helpers';
import TOTP from './TOTP';

jest.mock('otplib-core');

describe('TOTP', () => {
  let lib;

  function mockOptions() {
    core.totpOptions.mockImplementation(() => ({
      secret: 'secret'
    }));
  }

  beforeEach(() => {
    lib = new TOTP();
    resetObjectMocks(core);
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
    core.totpOptions.mockImplementation(() => ({
      secret: 'secret'
    }));

    methodExpectation('generate', 'totpToken');
  });

  it('method: generate => totpToken ', () => {
    methodExpectationWithOptions('generate', 'totpToken', ['secret']);
  });

  it('method: check', () => {
    mockOptions();

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
    mockOptions();

    methodExpectation('checkDelta', 'totpCheckWithWindow');
  });

  it('method: checkDelta => totpCheckWithWindow ', () => {
    methodExpectationWithOptions('checkDelta', 'totpCheckWithWindow', [
      'token',
      'secret'
    ]);
  });

  it('method: verify', () => {
    mockOptions();
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

  it('method: totpTimeRemaining', () => {
    mockOptions();
    methodExpectation('timeRemaining', 'totpTimeRemaining');
  });

  it('method: totpTimeUsed', () => {
    mockOptions();
    methodExpectation('timeUsed', 'totpTimeUsed');
  });

  function methodExpectation(methodName, coreName) {
    core[coreName].mockImplementation(() => 'result');

    expect(typeof lib[methodName] === 'function').toBe(true);
    expect(() => lib[methodName]()).not.toThrow(Error);
  }

  function methodExpectationWithOptions(methodName, coreName, args) {
    lib.options = { epoch: 1519995424045 };
    core[coreName].mockImplementation(() => 'result');

    lib[methodName](...args);
    expect(core[coreName]).toHaveBeenCalledTimes(1);
    expect(core[coreName]).toHaveBeenCalledWith(...args, lib.optionsAll);
  }
});
