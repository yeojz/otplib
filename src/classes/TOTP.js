import totpCheck from '../core/totpCheck';
import totpToken from '../core/totpToken';

/**
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
 * @class TOTP
 * @since 3.0.0
 * @author Gerald Yeo
 * @license MIT
 */
class TOTP {

  constructor() {
    this.opt = {
      epoch: null,
      step: 30,
      tokenLength: 6
    };
  }

  set step(value) {
    this.opt.step = value;
  }

  set epoch(value) {
    this.opt.epoch = value;
  }

  set tokenLength(value) {
    this.opt.tokenLength = value;
  }

  get step() {
    return this.opt.step;
  }

  get epoch() {
    return this.opt.epoch;
  }

  get tokenLength() {
    return this.opt.tokenLength;
  }

  options(opt = {}) {
    this.opt.tokenLength = opt.digits || this.opt.tokenLength; // backward compatibility
    this.opt.tokenLength = opt.tokenLength || this.opt.tokenLength;
    this.opt.step = opt.step || this.opt.step;
    this.opt.epoch = opt.epoch || this.opt.epoch;
  }

  generate(secret) {
    return totpToken(secret, this.opt);
  }

  check(token, secret){
    return totpCheck(token, secret, this.opt);
  }
}

export default TOTP;
