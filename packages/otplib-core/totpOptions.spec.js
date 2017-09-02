import totpSecret from './totpSecret';
import totpOptions from './totpOptions';

describe('totpOptions', function () {
  const SystemDate = global.Date;
  const value = new SystemDate('2017-01-01T00:00:00');

  const defaults = {
    algorithm: 'sha1',
    createHmacSecret: totpSecret,
    crypto: null,
    digits: 6,
    encoding: 'ascii',
    epoch: 1483228800000,
    step: 30
  };

  beforeEach(function () {
    global.Date = jest.fn(() => value);
  });

  afterEach(function () {
    global.Date = SystemDate;
  });

  it('should return default options', function () {
    expect(totpOptions()).toEqual(defaults);
    expect(totpOptions(null)).toEqual(defaults);
    expect(totpOptions(void 0)).toEqual(defaults);
  });

  it('should return options with new values added', function () {
    const opt = Object.assign({}, defaults, {
      extra: true
    });

    const expected = Object.assign({}, defaults, opt, {
      epoch: defaults.epoch * 1000
    });

    expect(totpOptions(opt)).toEqual(expected);
  });
});
