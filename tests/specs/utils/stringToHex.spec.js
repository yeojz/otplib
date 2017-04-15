import {expect} from 'chai';
import stringToHex from 'src/utils/stringToHex';

describe('utils/stringToHex', function () {
  it('should convert string to hex', function () {
    expect(stringToHex('this is a test')).to.equal('7468697320697320612074657374');
    expect(stringToHex('10012')).to.equal('3130303132');
  });

  it('should handle null inputs', function () {
    expect(stringToHex(void 0)).to.equal('');
    expect(stringToHex(null)).to.equal('');
  });
});
