import totpOptions from './totpOptions';
import totpSecret from './totpSecret';

describe('totpOptions', () => {
  const DateNow = global.Date.now;

  const defaults = {
    algorithm: 'sha1',
    createHmacSecret: totpSecret,
    crypto: null,
    digits: 6,
    encoding: 'ascii',
    epoch: 1483228800000,
    step: 30,
    window: 0
  };

  const epoch = {
    epoch: defaults.epoch * 1000
  };

  beforeEach(() => {
    global.Date.now = jest.fn(() => 1483228800000);
  });

  afterEach(() => {
    global.Date.now = DateNow;
  });

  it('should return default options', () => {
    expect(totpOptions()).toEqual(defaults);
    expect(totpOptions(null)).toEqual(defaults);
    expect(totpOptions(void 0)).toEqual(defaults);
  });

  it('should return javascript epoch', () => {
    const opt = Object.assign({}, defaults);
    const expected = Object.assign({}, opt, epoch);
    expect(totpOptions(opt)).toEqual(expected);
  });

  it('should return options with new values added', () => {
    const opt = Object.assign({}, defaults, {
      extra: true
    });

    const expected = Object.assign({}, opt, epoch);

    expect(totpOptions(opt)).toEqual(expected);
  });
});
