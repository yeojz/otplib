import HOTP from './HOTP';


/**
 * Instance of HOTP
 *
 * Time-based One-Time Password library
 *
 * ```js
 *  import crypto from 'crypto';
 *  import hotp from 'otplib/hotp';
 *
 *  hotp.options = {
 *    crypto
 *  }
 *
 *  hotp.generate(...)
 *  hotp.check(...)
 *  hotp.verify(...)
 * ```
 *
 * @module otplib-hotp
 * @since 3.0.0
 */
export default new HOTP();

