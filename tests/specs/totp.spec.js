import {expect} from 'chai';
import TOTP from '../../src/classes/TOTP';
import data from '../helpers/data';

describe('TOTP', function () {
  let otp;

  beforeEach(() => {
    otp = new TOTP();
  });

  it('check existence of methods', function () {
    let methods = [
      'generate',
      'check'
    ];

    methods.forEach((key) => {
      try {
        expect(otp[key]).to.be.an('function');
      } catch(err){
        throw new Error(err + ' (method: ' + key + ')');
      }
    });
  });

  it('[method/generate] correct codes', function () {
    otp.options = {
      epoch: data.totp[1]
    };

    expect(otp.generate(data.totp[0])).to.be.equal(data.totp[2]);
  });

  it('[method/check] pass/fail', function () {
    otp.options = {
      epoch: data.totp[1]
    };

    expect(otp.check(data.totp[2], data.totp[0])).to.be.equal(true);
    expect(otp.check(data.totp[2], data.totp[0] + 1)).to.be.equal(false);
  });
});
