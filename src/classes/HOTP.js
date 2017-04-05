import hotpCheck from '../core/hotpCheck';
import hotpToken from '../core/hotpToken';

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
 * @since 3.0.0
 * @author Gerald Yeo
 * @license MIT
 */
class HOTP {

  constructor() {
    this._digits = 6;
  }

  set digits(value) {
    this._digits = value;
  }

  set options(opt = {}) {
    this._digits = opt.digits || this._digits;
  }

  get digits() {
    return this._digits;
  }

  get options() {
    return {
      digits: this._digits
    }
  }

  generate(secret, counter) {
    return hotpToken(secret, counter, this.options)
  }

  check(token, secret, counter = 0) {
    return hotpCheck(token, secret, counter, this.options);
  }

  verify(opts = {}) {
    return this.check(opts.token, opts.secret, opts.counter);
  }
}

export default HOTP;
