import {expect} from 'chai';
import totp from 'src/totp';
import TOTP from 'src/classes/TOTP';

describe('totp', function () {
  it('should expose an instance of TOTP', function () {
    expect(totp).to.be.an.instanceOf(TOTP);
  });
});
