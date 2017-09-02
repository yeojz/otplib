import {hotpCheck, hotpToken} from 'otplib-core';

/**
 * HMAC-based One-time Password Algorithm
 *
 * ## References
 *
 * -   http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm
 * -   http://tools.ietf.org/html/rfc4226
 *
 * ## Algorithm
 *
 * ```
 * K be a secret secret
 * C be a counter
 * HMAC(K,C) = SHA1(K & 0x5c5c... | SHA1(K & 0x3636... | C))
 * be an HMAC calculated with the SHA-1 cryptographic hash algorithm
 * Truncate be a function that selects 4 bytes from the result of the
 * HMAC in a defined manner
 * HOTP(K,C) = Truncate(HMAC(K,C)) & 0x7FFFFFFF
 * HOTP-Value = HOTP(K,C) mod 10d, where d is the desired number of digits
 * ```
 *
 * @class HOTP
 * @module otplib-hotp/HOTP
 * @since 3.0.0
 */
class HOTP {

  constructor() {
    this._options = this.defaultOptions;
  }

  /**
   * getter for defaultOptions
   *
   * @return {object}
   */
  get defaultOptions() {
    return {};
  }

  /**
   * Getter and Setter methods for instance options
   * that will be used to override the defaults.
   *
   * ```
   * // Setter
   * const hotp = new HOTP();
   * hotp.options = {
   *   digits: 8
   * }
   * ```
   *
   * ```
   * // Getter
   * const hotp = new HOTP();
   * const opt = hotp.options;
   * ```
   *
   * @type {object}
   */
  set options(opt = {}) {
    if (opt) {
      this._options = Object.assign({}, this._options, opt);
    }
  }

  get options() {
    return Object.assign({}, this._options);
  }

  /**
   * Resets options to presets
   *
   * @param {object} option object
   * @return {instance}
   */
  resetOptions() {
    this._options = this.defaultOptions;
    return this;
  }

  /**
   * Generates token.
   * Passes instance options to underlying core function
   *
   * @param {string} secret
   * @param {number} counter
   * @return {string}
   * @see {@link module:core/hotpToken} for more information.
   */
  generate(secret, counter) {
    return hotpToken(secret, counter, this.options)
  }

  /**
   * Checks validity of token.
   * Passes instance options to underlying core function
   *
   * @param {string} token
   * @param {string} secret
   * @param {number} counter
   * @return {boolean}
   * @see {@link module:core/hotpCheck} for more information.
   */
  check(token, secret, counter) {
    return hotpCheck(token, secret, counter, this.options);
  }

  /**
   * Alias method for `check` that accepts an object as argument instead
   *
   * @param {string} options.token
   * @param {string} options.secret
   * @param {number} options.counter
   * @return {boolean}
   */
  verify(opts) {
    if (typeof opts !== 'object' || opts == null) {
      return false;
    }
    return this.check(opts.token, opts.secret, opts.counter);
  }
}

HOTP.prototype.HOTP = HOTP;
export default HOTP;
