import { hotpCheck, hotpToken, hotpOptions } from 'otplib-core';

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
    this._defaultOptions = {};
    this._options = this._defaultOptions;
  }

  /**
   * returns a HOTP class
   *
   * @return {class}
   */
  getClass() {
    return HOTP;
  }

  /**
   * Sets an option as instance default.
   * Setting an option as default will allow it to persist
   * even if resetOptions is called
   *
   * @since 10.2.0
   * @type {object}
   */
  set defaultOptions(opt = {}) {
    if (opt) {
      this._defaultOptions = Object.assign({}, this.defaultOptions, opt);
      this.options = opt;
    }
  }

  /**
   * Returns the defaultOptions
   *
   * @return {object}
   */
  get defaultOptions() {
    return this._defaultOptions;
  }

  /**
   * Sets the instance options
   * that will be used to override the defaults.
   *
   * ```
   * const hotp = new HOTP();
   * hotp.options = {
   *   digits: 8
   * }
   * ```
   *
   * @type {object}
   */
  set options(opt = {}) {
    if (opt) {
      this._options = Object.assign({}, this._options, opt);
    }
  }

  /**
   * Gets the current instance options
   * without presets
   *
   * ```
   * const hotp = new HOTP();
   * const opt = hotp.options;
   * ```
   *
   * @return {object}
   */
  get options() {
    return Object.assign({}, this._options);
  }

  /**
   * Returns instance options, preset with
   * all missing library defaults
   *
   * @return {object}
   */
  get optionsAll() {
    return hotpOptions(this._options);
  }

  /**
   * Resets options to presets and
   * any preferences set in defaultOptions
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
    const opt = this.optionsAll;
    return hotpToken(secret || opt.secret, counter, opt);
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
    const opt = this.optionsAll;
    return hotpCheck(token, secret || opt.secret, counter, opt);
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
