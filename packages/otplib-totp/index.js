import TOTP from './TOTP';

/**
 * Instance of TOTP
 *
 * Time-based One-Time Password library
 *
 * ```js
 *  import crypto from 'crypto';
 *  import totp from 'otplib/totp';
 *
 *  totp.options = {
 *    crypto
 *  }
 *
 *  totp.generate(...)
 *  totp.check(...)
 *  totp.verify(...)
 * ```
 *
 * @module otplib-totp
 * @since 3.0.0
 */
export default new TOTP();
