import {totpCheckWithWindow, totpToken, totpOptions} from 'otplib-core';
import hotp from 'otplib-hotp';

const HOTP = hotp.HOTP;

/**
 * Time-based One-time Password Algorithm
 *
 * ## References
 *
 * -   http://tools.ietf.org/html/rfc6238
 * -   http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm
 *
 * ## Algorithm
 *
 * ```
 * T0 be an epoch
 * TS be the time stemp
 * TC be the current timestamp turned into an int, using defined T0, counting in TS units
 * TC = (unixtime(now) - unixtime(T0)) / TS
 * TOTP = HOTP(secretsecret, TC), where the HOTP algorithm is defined below.
 * TOTP-Value = TOTP mod 10d, where d is the desired number of digits of the one-time password.
 * ```
 *
 * @class TOTP
 * @module otplib-totp/TOTP
 * @extends {HOTP}
 * @since 3.0.0
 */
class TOTP extends HOTP {

  constructor() {
    super();
  }

  /**
   * getter for defaultOptions
   *
   * @return {object}
   */
  get defaultOptions() {
    return {
      epoch: null,
      step: 30,
      window: 0
    };
  }

  /**
   * Returns instance options, polyfilled with
   * all missing library defaults
   *
   * @return {object}
   */
  get optionsAll() {
    return totpOptions(this._options)
  }

  /**
   * Generates token.
   * Passes instance options to underlying core function
   *
   * @param {string} secret
   * @return {string}
   * @see {@link module:core/totpToken}
   */
  generate(secret) {
    const opt = this.optionsAll;
    return totpToken(secret || opt.secret, opt);
  }

  /**
   * Checks validity of token.
   * Passes instance options to underlying core function
   *
   * @param {string} token
   * @param {string} secret
   * @return {boolean}
   * @see {@link module:core/totpCheck}
   */
  check(token, secret){
    const opt = this.optionsAll;
    return totpCheckWithWindow(token, secret || opt.secret, opt);
  }

  /**
   * Alias method for `check` that accepts an object as argument instead
   *
   * @param {string} options.token
   * @param {string} options.secret
   * @return {boolean}
   */
  verify(opts) {
    if (typeof opts !== 'object' || opts == null) {
      return false;
    }
    return this.check(opts.token, opts.secret);
  }
}

TOTP.prototype.TOTP = TOTP;
export default TOTP;
