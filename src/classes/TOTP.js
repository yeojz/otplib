

import HOTP from './HOTP';




/**
 *
 * Time-based One-time Password Algorithm
 *
 * References
 * --------------------------
 * - http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm
 * - http://tools.ietf.org/html/rfc6238
 *
 *
 * Algorithm
 * --------------------------
 * ```
 *  T0 be an epoch
 *  TS be the time stemp
 *  TC be the current timestamp turned into an int, using defined T0, counting in TS units
 *  TC = (unixtime(now) - unixtime(T0)) / TS
 *  TOTP = HOTP(secretsecret, TC), where the HOTP algorithm is defined below.
 *  TOTP-Value = TOTP mod 10d, where d is the desired number of digits of the one-time password.
 * ```
 *
 * @extends {HOTP}
 * @since 3.0.0
 * @author Gerald Yeo <contact@fusedthought.com>
 * @license MIT
 *
 */
export default class TOTP extends HOTP {

  /**
   * Creates the instance
   */
  constructor() {
    super();

    /**
     * @type {number}
     */
    this.step = 30;

    /**
     * @type {number}
     */
    this.epoch = null;
  }




  /**
   * Option Setter
   *
   * @param {object} opt - Custom options
   */
  options(opt = {}) {
    super.options(opt);
    this.step = opt.step || this.step;
  }




  /**
   * Generates the OTP code
   *
   * @param {string} secret - Your secret that is used to generate the token
   *
   * @return {number} OTP Code
   */
  generate(secret) {
    let epoch = this.epoch || new Date().getTime();
    let timeStep = this.step;
    let timeCounter = Math.floor(epoch / (timeStep * 1000.0));
    let code = super.generate(secret, timeCounter);

    return code;
  }




  /**
   * Checks the provided OTP token against system generated token
   *
   * @param {string} token - The OTP token to check
   * @param {string} secret - Your secret that is used to generate the token
   *
   * @return {boolean}
   */
  check(token, secret){
    let systemToken = this.generate(secret);
    return this.utils.isSameToken(token, systemToken);
  }
}



