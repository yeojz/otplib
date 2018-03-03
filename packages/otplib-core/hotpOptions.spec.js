import hotpSecret from './hotpSecret';
import hotpOptions from './hotpOptions';

describe('hotpOptions', () => {
  const defaults = {
    algorithm: 'sha1',
    createHmacSecret: hotpSecret,
    digits: 6,
    encoding: 'ascii',
    crypto: null
  };

  it('should return default when option is null', () => {
    expect(hotpOptions(null)).toEqual(defaults);
  });

  it('should return default when option is undefined', () => {
    expect(hotpOptions(void 0)).toEqual(defaults);
  });

  it('should return options with new values added', () => {
    const opt = Object.assign({}, defaults, {
      extra: true
    });

    expect(hotpOptions(opt)).toEqual(opt);
  });
});
