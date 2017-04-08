import {expect} from 'chai';
import {stub} from 'sinon';
import totpOptions from 'src/core/totpOptions';

describe('core/totpOptions', function () {
  const defaults = {
    algorithm: 'sha1',
    digits: 6,
    encoding: 'ascii',
    epoch: '12345678',
    step: 30
  }

  beforeEach(function() {
    stub(Date.prototype, 'getTime').returns('12345678')
  });

  afterEach(function() {
    Date.prototype.getTime.restore();
  })

  it('should return default options', function () {
    expect(totpOptions()).to.deep.equal(defaults);
    expect(totpOptions(null)).to.deep.equal(defaults);
    expect(totpOptions(void 0)).to.deep.equal(defaults);
  });

  it('should return options with new values added', function () {
    const opt = {
      ...defaults,
      extra: true
    }
    expect(totpOptions(opt)).to.deep.equal({
      ...defaults,
      ...opt
    });
  });
});
