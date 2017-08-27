import hotp from 'otplib-hotp';
import totp from 'otplib-totp';
import authenticator from 'otplib-authenticator';
import crypto from './crypto';

/**
 * otplib-browser
 *
 * One-Time Password Library for browser
 *
 * @module otplib-browser
 * @since 3.0.0
 */
authenticator.options = {crypto}
hotp.options = {crypto}
totp.options = {crypto}

module.exports = {
  Authenticator: authenticator.Authenticator,
  HOTP: hotp.HOTP,
  TOTP: totp.TOTP,
  authenticator,
  hotp,
  totp,
};
