import {expect} from 'chai';
import isSameToken from 'src/utils/isSameToken';

describe('utils/isSameToken', function () {
  it('should return true when are same integer', function () {
    expect(isSameToken(10, 10)).to.be.true;
  });

  it('should return true when are same integer strings', function () {
    expect(isSameToken('10', '10')).to.be.true;
  });

  it('should return true even when one is an integer string', function () {
    expect(isSameToken(10, '10')).to.be.true;
  });

  it('should return false when both are same non-integer strings', function () {
    expect(isSameToken('test', 'test')).to.be.false;
  });

  it('should compare properly when not base10', function () {
    expect(isSameToken(10.0, 10.1)).to.be.false;
    expect(isSameToken(10.1, 10.1)).to.be.true;
    expect(isSameToken('10.0', '10.1')).to.be.false;
  });
});
