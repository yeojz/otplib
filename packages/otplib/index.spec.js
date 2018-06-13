import hotp from 'otplib-hotp';
import totp from 'otplib-totp';
import authenticator from 'otplib-authenticator';

import * as otplib from './index';

describe('index', () => {
  it('should expose an instance of HOTP', () => {
    expect(otplib.hotp).toBeInstanceOf(hotp.HOTP);
  });

  it('should expose an instance of TOTP', () => {
    expect(otplib.totp).toBeInstanceOf(totp.TOTP);
  });

  it('should expose an instance of Authenticator', () => {
    expect(otplib.authenticator).toBeInstanceOf(authenticator.Authenticator);
  });
});
