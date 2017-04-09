import secretKey from '../utils/secretKey';
import decodeKey from '../impl/authenticator/decodeKey';
import encodeKey from '../impl/authenticator/encodeKey';
import keyuri from '../impl/authenticator/keyuri';
import token from '../impl/authenticator/token';
import TOTP from './TOTP';

/**
 * Google Authenticator adapter
 *
 * ## References
 * -   http://en.wikipedia.org/wiki/Google_Authenticator
 *
 * ## Algorithm
 *
 * ```
 * secret := base32decode(secret)
 * message := floor(current Unix time / 30)
 * hash := HMAC-SHA1(secret, message)
 * offset := last nibble of hash
 * truncatedHash := hash[offset..offset+3]  //4 bytes starting at the offset
 * set the first bit of truncatedHash to zero  //remove the most significant bit
 * code := truncatedHash mod 1000000
 * pad code with 0 until length of code is 6
 *
 * return code
 * ```
 *
 * @class Authenticator
 * @extends {TOTP}
 * @since 3.0.0
 * @author Gerald Yeo
 * @license MIT
 */
class Authenticator extends TOTP {

  constructor() {
    super();

    this.options = {
      epoch: null
    }
  }

  /**
   * @see {@link module:impl/authenticator/encodeKey} for more information.
   */
  encode(...args) {
    return encodeKey(...args);
  }

  /**
   * @see {@link module:impl/authenticator/decodeKey} for more information.
   */
  decode(...args) {
    return decodeKey(...args);
  }

  /**
   * @see {@link module:impl/authenticator/keyuri} for more information.
   */
  keyuri(...args) {
    return keyuri(...args);
  }

  /**
   * @see {@link module:impl/authenticator/secretKey} for more information.
   */
  generateSecret(len = 20) {
    if (len == null) {
      return '';
    }
    const secret = secretKey(len);
    return encodeKey(secret);
  }

  /**
   * @see {@link module:impl/authenticator/token} for more information.
   */
  generate(secret) {
    return token(secret, this.options);
  }
}

export default Authenticator;
