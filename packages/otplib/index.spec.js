import hotp from 'otplib-hotp';
import totp from 'otplib-totp';
import authenticator from 'otplib-authenticator';

import otplib from './index';

describe('index', () => {
  it('should expose hotp class', () => {
    expect(otplib.HOTP).toEqual(hotp.HOTP);
  });

  it('should expose an instance of HOTP', () => {
    expect(otplib.hotp).toBeInstanceOf(hotp.HOTP);
  });

  it('should expose totp class', () => {
    expect(otplib.TOTP).toEqual(totp.TOTP);
  });

  it('should expose an instance of TOTP', () => {
    expect(otplib.totp).toBeInstanceOf(totp.TOTP);
  });

  it('should expose authenticator class', () => {
    expect(otplib.Authenticator).toEqual(authenticator.Authenticator);
  });

  it('should expose an instance of Authenticator', () => {
    expect(otplib.authenticator).toBeInstanceOf(authenticator.Authenticator);
  });
});
