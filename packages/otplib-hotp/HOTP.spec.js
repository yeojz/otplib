import * as core from 'otplib-core';
import HOTP from './HOTP';

describe('HOTP', function () {
  let otplib;

  beforeEach(() => {
    otplib = new HOTP();
  });

  it('options setter / getter should work', function () {
    const prev = otplib.options;
    const newOptions = {
      test: 'value'
    }
    otplib.options = newOptions;

    expect(prev).not.toEqual(otplib.options);
    expect(otplib.options).toEqual(Object.assign({}, prev, newOptions));
  });

  it('options setter should take in null ', function () {
    const prev = otplib.options;
    otplib.options = null;
    expect(prev).toEqual(otplib.options);
  });

  it('options setter should take in void 0 ', function () {
    const prev = otplib.options;
    otplib.options = void 0;
    expect(prev).toEqual(otplib.options);
  });

  it('method: generate', function () {
    methodExpectation('generate');
  });

  it('method: generate => hotpToken ', function () {
    methodPassthrough('generate', 'hotpToken', [
      'secret',
      'counter'
    ]);
  });

  it('method: check', function () {
    methodExpectation('check');
  });

  it('method: check => hotpCheck ', function () {
    methodPassthrough('check', 'hotpCheck', [
      'token',
      'secret',
      'counter'
    ]);
  });

  it('method: verify', function () {
    methodExpectation('verify');
  });

  it('method: verify return false when not an object', function () {
    const result = otplib.verify('string');
    expect(result).toBe(false);
  });

  it('method: verify return false when null', function () {
    const result = otplib.verify(null);
    expect(result).toBe(false);
  });

  it('method: verify return false when undefined', function () {
    const result = otplib.verify();
    expect(result).toBe(false);
  });

  it('method: verify calls check', function () {
    const spy = jest.spyOn(otplib, 'check');

    otplib.verify({
      token: 'token',
      secret: 'secret',
      counter: 'counter',
    });

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]).toEqual(['token', 'secret', 'counter'])
    spy.mockReset();
  });

  function methodExpectation(methodName) {
    expect(typeof otplib[methodName] === 'function').toBe(true);
    expect(() => otplib[methodName]()).not.toThrow(Error);
  }

  function methodPassthrough(methodName, coreName, args) {
    const spy = jest.spyOn(core, coreName)
      .mockImplementation(() => 'result');

    otplib[methodName](...args);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]).toEqual([...args, {}])
    spy.mockReset();
  }
});
