import hotp from 'otplib-hotp';
import totp from 'otplib-totp';
import authenticator from 'otplib-authenticator';

import otplib from './index';

describe('index', function () {
  it('should expose hotp class', function () {
    expect(otplib.HOTP).toEqual(hotp.HOTP);
  });

  it('should expose an instance of HOTP', function () {
    expect(otplib.hotp).toBeInstanceOf(hotp.HOTP);
  });

  it('should expose totp class', function () {
    expect(otplib.TOTP).toEqual(totp.TOTP);
  });

  it('should expose an instance of TOTP', function () {
    expect(otplib.totp).toBeInstanceOf(totp.TOTP);
  });

  it('should expose authenticator class', function () {
    expect(otplib.Authenticator).toEqual(authenticator.Authenticator);
  });

  it('should expose an instance of Authenticator', function () {
    expect(otplib.authenticator).toBeInstanceOf(authenticator.Authenticator);
  });
});
