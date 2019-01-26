import {
  totpCheckWithWindow,
  totpOptions,
  totpTimeRemaining,
  totpTimeUsed,
  totpToken
} from 'otplib-core';
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

    this._defaultOptions = {
      epoch: null,
      step: 30,
      window: 0
    };

    this._options = this._defaultOptions;
  }

  /**
   * returns a TOTP class
   *
   * @return {class}
   */
  getClass() {
    return TOTP;
  }

  /**
   * Returns instance options, polyfilled with
   * all missing library defaults
   *
   * @return {object}
   */
  get optionsAll() {
    return totpOptions(this._options);
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
   */
  check(token, secret) {
    const delta = this.checkDelta(token, secret);
    return Number.isInteger(delta);
  }

  /**
   * Checks validity of token
   * Returns the delta (window) which token passes.
   * Returns null otherwise.
   * Passes instance options to underlying core function
   *
   * @param {string} token
   * @param {string} secret
   * @return {integer | null}
   * @see {@link module:core/totpCheckWithWindow}
   */
  checkDelta(token, secret) {
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

  /**
   * Calculates the number of seconds to before current token is invalid.
   *
   * @return {integer}
   * @see {@link module:core/totpTimeRemaining}
   */
  timeRemaining() {
    const opt = this.optionsAll;
    return totpTimeRemaining(opt.epoch, opt.step);
  }

  /**
   * Calculates the number of seconds used for the current token validity period.
   *
   * @return {integer}
   * @see {@link module:core/totpTimeUsed}
   */
  timeUsed() {
    const opt = this.optionsAll;
    return totpTimeUsed(opt.epoch, opt.step);
  }
}

TOTP.prototype.TOTP = TOTP;
export default TOTP;
