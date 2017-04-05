import {expect} from 'chai';
import leftPad from 'src/utils/leftPad';

describe('utils/leftPad', function () {
  it('should pad a value by length', function () {
    expect(leftPad('1', 5)).to.equal('00001')
  });

  it('should pad gracefully return with invalid length', function () {
    expect(leftPad('1', null)).to.equal('1');
    expect(leftPad('1', void 0)).to.equal('1');
    expect(leftPad('1', -1)).to.equal('1');
  });
});
