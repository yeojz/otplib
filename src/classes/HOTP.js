import hotpCheck from '../core/hotpCheck';
import hotpToken from '../core/hotpToken';
import OTPUtils from './classes/OTPUtils';

/**
 * HMAC-based One-time Password Algorithm
 *
 * References
 * --------------------------
 * - http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm
 * - http://tools.ietf.org/html/rfc4226
 *
 * Algorithm
 * --------------------------
 * ```
 *  K be a secret secret
 *  C be a counter
 *  HMAC(K,C) = SHA1(K & 0x5c5c... | SHA1(K & 0x3636... | C))
 *  be an HMAC calculated with the SHA-1 cryptographic hash algorithm
 *  Truncate be a function that selects 4 bytes from the result of the
 *  HMAC in a defined manner
 *  HOTP(K,C) = Truncate(HMAC(K,C)) & 0x7FFFFFFF
 *  HOTP-Value = HOTP(K,C) mod 10d, where d is the desired number of digits
 * ```
 *
 * @class HOTP
 * @since 3.0.0
 * @author Gerald Yeo
 * @license MIT
 */
class HOTP {

  constructor() {
    this.opt = {
      tokenLength: 6
    }
  }

  set tokenLength(value) {
    this.opt.tokenLength = value;
  }

  get tokenLength() {
    return this.opt.tokenLength;
  }

  get utils() {
    return OTPUtils;
  }

  options(opt = {}) {
    this.opt.tokenLength = opt.digits || this.opt.tokenLength; // backward compatibility
    this.opt.tokenLength = opt.tokenLength || this.opt.tokenLength;
  }

  generate(secret, counter) {
    return hotpToken(secret, counter, this.opt)
  }

  check(token, secret, counter = 0) {
    return hotpCheck(token, secret, counter, this.opt);
  }
}

export default HOTP;
