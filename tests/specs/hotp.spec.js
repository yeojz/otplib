import {expect} from 'chai';
import hotp from 'src/hotp';
import HOTP from 'src/classes/HOTP';

describe('hotp', function () {
  it('should expose an instance of HOTP', function () {
    expect(hotp).to.be.an.instanceOf(HOTP);
  });
});
