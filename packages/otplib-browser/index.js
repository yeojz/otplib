import hotp from 'otplib-hotp';
import totp from 'otplib-totp';
import authenticator from 'otplib-authenticator';
import crypto from './crypto';

/**
 * otplib-browser
 *
 * One-Time Password Library for browser
 *
 * @since 3.0.0
 * @author Gerald Yeo
 * @license MIT
 */
authenticator.options = {crypto}
hotp.options = {crypto}
totp.options = {crypto}

export default {
  Authenticator: authenticator.Authenticator,
  HOTP: hotp.HOTP,
  TOTP: totp.TOTP,
  authenticator,
  hotp,
  totp,
};
