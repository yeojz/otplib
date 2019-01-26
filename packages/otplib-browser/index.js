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
authenticator.defaultOptions = { crypto };
hotp.defaultOptions = { crypto };
totp.defaultOptions = { crypto };

module.exports = {
  authenticator,
  hotp,
  totp
};
