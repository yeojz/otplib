import totpCheck from '../core/totpCheck';
import totpToken from '../core/totpToken';
import HOTP from './HOTP';

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
 * @extends {HOTP}
 * @since 3.0.0
 * @author Gerald Yeo
 * @license MIT
 */
class TOTP extends HOTP {

  constructor() {
    super();
    this._epoch = null;
    this._step = 30;
  }

  set step(value) {
    this._step = value;
  }

  set epoch(value) {
    this._epoch = value;
  }

  set options(opt = {}) {
    super.options = opt;
    this._step = opt.step || this._step;
    this._epoch = opt.epoch || this._epoch;
  }

  get step() {
    return this._step;
  }

  get epoch() {
    return this._epoch;
  }

  get options() {
    return {
      step: this._step,
      epoch: this._epoch,
      ...super.options
    }
  }

  generate(secret) {
    return totpToken(secret, this.options);
  }

  check(token, secret){
    return totpCheck(token, secret, this.options);
  }

  verify(opts = {}) {
    return this.check(opts.token, opts.secret);
  }
}

export default TOTP;
