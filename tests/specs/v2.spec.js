import {expect} from 'chai';
import otplib from 'src/v2';

const hotpPass = [
  ['i6im0gc96j0mn00c', 47412420, '196182'],
  ['65jh84eo38k32edm', 47412423, '963234'],
  ['f4515l6ob3gkganp', 47412433, '415572'],
  ['2o9989k76ij7eh9c', 47412435, '343659']
];

const hotpFail = [
  ['9821741871231', 1078968, 'Should fail'],
  ['18748612', 982671, '18748612'],
  ['18748612', 982671, '125832']
];

describe('Legacy (2.x.x adapter)', function () {

  it('[Core] ensure entry methods exist', function () {
    expect(otplib).to.be.an('object');
    expect(otplib.core).to.be.an('object');

    expect(otplib.core.totp).to.be.an('function');
    expect(otplib.core.hotp).to.be.an('function');

    expect(otplib.core.checkTOTP).to.be.an('function');
    expect(otplib.core.checkHOTP).to.be.an('function');
  });

  it('[GA] ensure entry methods exist', function () {
    expect(otplib.google).to.be.an('object');
    expect(otplib.google.generate).to.be.an('function');
    expect(otplib.google.secret).to.be.an('function');
    expect(otplib.google.check).to.be.an('function');
  });

  it('[Core/HOTP] ensure correct code generation', function () {

    hotpPass.forEach((entry) => {
      const result = otplib.core.hotp(entry[0], entry[1]);
      expect(result).to.be.eql(entry[2]);
    });

    hotpFail.forEach((entry) => {
      const result = otplib.core.hotp(entry[0], entry[1]);
      expect(result).to.not.eql(entry[2]);
    });
  });

  it('[Core/HOTP] method `check`', function () {
    hotpPass.forEach((entry) => {
      const result = otplib.core.checkHOTP(entry[2], entry[0], entry[1]);
      expect(result).to.be.eql(true);
    });

    hotpFail.forEach((entry) => {
      const result = otplib.core.checkHOTP(entry[2], entry[0], entry[1])
      expect(result).to.be.eql(false);
    });
  });

  it('[Core/TOTP] ensure correct code generation', function () {
    otplib.core.epoch = 59 * 1000;
    expect(otplib.core.totp('12341234123412341234')).to.be.eql('972213');
  });

  it('[Core/TOTP] method `check`', function () {
    let key = 972213;
    let result;

    otplib.core.epoch = 59 * 1000;
    result = otplib.core.checkTOTP(key, '12341234123412341234');
    expect(result).to.be.eql(true);

    otplib.core.epoch = 59 * 1000;
    result = otplib.core.checkTOTP(key + 1, '12341234123412341234');
    expect(result).to.be.eql(false);
  });

  it('[Core/Secret] should generate secret of specified length', function () {
    expect(otplib.core.secret.generate(-1).length).to.be.eql(0);

    expect(otplib.core.secret.generate().length).to.be.eql(16);

    expect(otplib.core.secret.generate(1).length).to.be.eql(1);
    expect(otplib.core.secret.generate(8).length).to.be.eql(8);
    expect(otplib.core.secret.generate(128).length).to.be.eql(128);
  });

  it('[GA/Secret] should generate secret of specified length', function () {
    expect(otplib.google.secret(-1).length).to.be.eql(0);

    expect(otplib.google.secret().length).to.be.eql(16);

    expect(otplib.google.secret(1).length).to.be.eql(1);
    expect(otplib.google.secret(8).length).to.be.eql(8);
    expect(otplib.google.secret(128).length).to.be.eql(128);
  });

  it('[GA/encode-decode] should check encoding and decoding correctness', function () {
    let s = otplib.google.secret();

    let e = otplib.google.encode(s);
    let d = otplib.google.decode(e);

    expect(s).to.be.eql(d);
  });

  it('[GA/OTP] ensure correct token length', function () {

    // Secret length between 10 and 50
    function rlen() {
      return (Math.random() * 39 + 10).toString(10)
        .slice(0, 2);
    }

    for (let i = 0; i < 6; i++) {
      let s = otplib.google.secret(rlen());
      let t = otplib.google.generate(s);
      expect(t.length).to.be.eql(6);
    }
  });

  it('[GA/keyuri] should ensure correct uri', function () {
    const url = 'otpauth://totp/test:me?secret=123&issuer=test';
    const result = otplib.google.keyuri('me', 'test', '123');
    const expected = encodeURIComponent(url);
    expect(result).to.be.equal(expected);
  });
});
