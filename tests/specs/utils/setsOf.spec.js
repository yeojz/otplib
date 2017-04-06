import {expect} from 'chai';
import setsOf from 'src/utils/setsOf';

describe('utils/setsOf', function () {
  it('should break into sets of 4 by default', function () {
    expect(setsOf('123a223b333c')).to.equal('123a 223b 333c');
  });

  it('should break into specified sets', function () {
    expect(setsOf('123a223b333c', 2)).to.equal('12 3a 22 3b 33 3c');
  });

  it('should break into specified sets with specified divider', function () {
    expect(setsOf('123a223b333c', 2, '-')).to.equal('12-3a-22-3b-33-3c');
  });

  it('should handle string values', function () {
    expect(setsOf(null)).to.equal('');
    expect(setsOf(void 0)).to.equal('');
    expect(setsOf(1234)).to.equal('');
  })

  it('should handle non-integer divisor by returning empty string', function () {
    expect(setsOf('123a223b333c', null)).to.equal('');
    expect(setsOf('123a223b333c', 'abcd')).to.equal('');
  })
});
