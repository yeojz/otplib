
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

  [
    ['null', null],
    ['undefined', void 0]
  ].forEach((entry) => {
    it(`should return default when option is ${entry[0]}`, function () {
      expect(hotpOptions(entry[1])).toEqual(defaults);
    });
  });

  it('should return options with new values added', function () {
    const opt = Object.assign({}, defaults, {
      extra: true
    });

    expect(hotpOptions(opt)).toEqual(opt);
  });
});
