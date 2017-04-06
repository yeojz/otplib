import {expect} from 'chai';
import TOTP from 'src/classes/TOTP';
import data from 'tests/helpers/data';

describe('classes/TOTP', function () {
  let otp;

  beforeEach(() => {
    otp = new TOTP();
  });

  it('should contain expected method interfaces', function () {
    [
      'generate',
      'check'
    ].forEach((key) => {
      const fn = () => otp[key];
      expect(fn).to.not.throw(Error)
      expect(fn).to.be.a('function');
    });
  });

  it('[method/generate] correct codes', function () {
    data.totp.forEach((entry) => {
      otp.options = {
        epoch: entry[1]
      };

      expect(otp.generate(entry[0])).to.be.equal(entry[2]);
    });
  });

  it('[method/check] pass/fail', function () {

    data.totp.forEach((entry) => {
      otp.options = {
        epoch: entry[1]
      };

      expect(otp.check(entry[2], entry[0])).to.be.equal(true);
      expect(otp.check(entry[2], entry[0] + 1)).to.be.equal(false);
    })
  });
});
