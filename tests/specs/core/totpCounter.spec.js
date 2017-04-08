import {expect} from 'chai';
import totpCounter from 'src/core/totpCounter';

describe('core/totpCounter', function () {
  it('should return expected counter values', function () {
    expect(totpCounter(60000, 30)).to.equal(2)
    expect(totpCounter(90000, 30)).to.equal(3)
  });
});
