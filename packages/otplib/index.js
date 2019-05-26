import hotp from 'otplib-hotp';
import totp from 'otplib-totp';
import authenticator from 'otplib-authenticator';
import crypto from 'crypto';

/**
 * otplib
 *
 * One-Time Password Library
 *
 * ```js
 * {
 *    authenticator // instance
 *    hotp // instance
 *    totp // instance
 * }
 * ```
 *
 * @module otplib
 * @since 3.0.0
 */
authenticator.defaultOptions = { crypto };
hotp.defaultOptions = { crypto };
totp.defaultOptions = { crypto };

export { authenticator, hotp, totp };
export default {
  authenticator,
  hotp,
  totp
};
