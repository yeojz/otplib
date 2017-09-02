
import hotpSecret from './hotpSecret';
import hotpOptions from './hotpOptions';

describe('hotpOptions', function () {
  const defaults = {
    algorithm: 'sha1',
    createHmacSecret: hotpSecret,
    digits: 6,
    encoding: 'ascii',
    crypto: null
  };

  it('should return default when option is null', function () {
    expect(hotpOptions(null)).toEqual(defaults);
  });

  it('should return default when option is undefined', function () {
    expect(hotpOptions(void 0)).toEqual(defaults);
  });

  it('should return options with new values added', function () {
    const opt = Object.assign({}, defaults, {
      extra: true
    });

    expect(hotpOptions(opt)).toEqual(opt);
  });
});
