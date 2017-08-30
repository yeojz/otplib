import Authenticator from './Authenticator';

/**
 * Instance of Authenticator
 *
 * Google Authenticator library
 *
 * ```js
 *  import crypto from 'crypto';
 *  import authenticator from 'otplib/authenticator';
 *
 *  authenticator.options = {
 *    crypto
 *  }
 *
 *  authenticator.generate(...)
 *  authenticator.check(...)
 *  authenticator.generateSecret(...)
 * ```
 *
 * @module otplib-authenticator
 * @since 3.0.0
 */
export default new Authenticator();
