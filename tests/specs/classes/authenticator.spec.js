import {expect} from 'chai';

import Authenticator from 'src/classes/Authenticator';

describe('classes/Authenticator', function() {

  let otp;

  beforeEach(function () {
    otp = new Authenticator();
  });

  it('should contain expected method interfaces', function () {
    [
      'generate',
      'check',
      'keyuri',
      'encode',
      'decode',
      'generateSecret'
    ].forEach((key) => {
      const fn = () => otp[key];
      expect(fn).to.not.throw(Error)
      expect(fn).to.be.a('function');
    });
  });
  //
  //
  // it('[generateSecret] length of key', function () {
  //   expect(otp.generateSecret().length).to.be.equal(16);
  //   expect(otp.generateSecret(20).length).to.be.equal(20);
  // });
  //
  // it('[keyuri] generate expect keyuri', function () {
  //   let url = otp.keyuri('me', 'test', '123');
  //   expect(url).to.be.equal(encodeURIComponent('otpauth://totp/test:me?secret=123&issuer=test'));
  // });
  //
  // it('[encode] check for correct encoding', function () {
  //   data.codec.forEach((entry) => {
  //       expect(otp.encode(entry[0])).to.be.equal(entry[1]);
  //   });
  // });
  //
  // it('[decode] check for correct decoding', function () {
  //   data.codec.forEach((entry) => {
  //       expect(otp.decode(entry[1])).to.be.equal(entry[0]);
  //   });
  // });
});
