import {expect} from 'chai';
import hexToInt from 'src/utils/hexToInt';

describe('utils/hexToInt', function () {
  it('should convert hex to integer', function () {
    expect(hexToInt('3e8')).to.equal(1000);
  });
});
