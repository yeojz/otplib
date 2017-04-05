import {expect} from 'chai';
import hotpOptions from 'src/core/hotpOptions';

describe('core/hotpOptions', function () {
  const defaults = {
    digits: 6
  }

  it('should return default options', function () {
    expect(hotpOptions()).to.deep.equal(defaults);
    expect(hotpOptions(null)).to.deep.equal(defaults);
    expect(hotpOptions(void 0)).to.deep.equal(defaults);
  });

  it('should return options with new values added', function () {
    const opt = {
      digits: 7,
      extra: true
    }
    expect(hotpOptions(opt)).to.deep.equal(opt);
  });
});
