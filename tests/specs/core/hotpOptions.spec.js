import {expect} from 'chai';
import hotpSecret from 'src/core/hotpSecret';
import hotpOptions from 'src/core/hotpOptions';

describe('core/hotpOptions', function () {
  const defaults = {
    algorithm: 'sha1',
    createHmacSecret: hotpSecret,
    digits: 6,
    encoding: 'ascii'
  };

  [
    ['null', null],
    ['undefined', void 0]
  ].forEach((entry) => {
    it(`should return default when option is ${entry[0]}`, function () {
      expect(hotpOptions(entry[1])).to.deep.equal(defaults);
    });
  });

  it('should return options with new values added', function () {
    const opt = {
      ...defaults,
      extra: true
    }
    expect(hotpOptions(opt)).to.deep.equal(opt);
  });
});
