import {expect} from 'chai';
import intToHex from 'src/utils/intToHex';

describe('utils/intToHex', function () {
  it('should convert integer to hex', function () {
    expect(intToHex(1000)).to.equal('3e8');
  });
});
