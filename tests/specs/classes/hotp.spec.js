import {expect} from 'chai';
import HOTP from 'src/classes/HOTP';

describe('classes/HOTP', function () {

  let otp;

  beforeEach(() => {
      otp = new HOTP();
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

  // it('[method/generate] correct codes', function () {
  //   data.passes.forEach((entry) => {
  //     const result = otp.generate(entry[0], entry[1]);
  //     expect(result).to.be.eql(entry[2]);
  //   });
  // });
  //
  // it('[method/generate] incorrect codes', function () {
  //   data.fails.forEach((entry) => {
  //     const result = otp.generate(entry[0], entry[1]);
  //     expect(result).to.not.eql(entry[2]);
  //   });
  // });
  //
  // it('[method/check] pass', function () {
  //   data.passes.forEach((entry) => {
  //     const result = otp.check(entry[2], entry[0], entry[1])
  //     expect(result).to.be.eql(true);
  //   });
  // });
  //
  // it('[method/check] fails', function () {
  //   data.fails.forEach((entry) => {
  //     const result = otp.check(entry[2], entry[0], entry[1])
  //     expect(result).to.be.eql(false);
  //   });
  // });
});
