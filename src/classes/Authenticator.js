import decodeKey from '../impl/authenticator/decodeKey';
import encodeKey from '../impl/authenticator/encodeKey';
import keyuri from '../impl/authenticator/keyuri';
import secretKey from '../impl/authenticator/secretKey';
import token from '../impl/authenticator/token';
import totpCheck from '../core/totpCheck';
import TOTP from './TOTP';

/**
 * Google Authenticator adapter
 *
 * References
 * --------------------------
 * - http://en.wikipedia.org/wiki/Google_Authenticator
 *
 * Algorithm
 * --------------------------
 * ```
 *  secret := base32decode(secret)
 *  message := floor(current Unix time / 30)
 *  hash := HMAC-SHA1(secret, message)
 *  offset := last nibble of hash
 *  truncatedHash := hash[offset..offset+3]  //4 bytes starting at the offset
 *  set the first bit of truncatedHash to zero  //remove the most significant bit
 *  code := truncatedHash mod 1000000
 *  pad code with 0 until length of code is 6
 *
 *  return code
 * ```
 *
 * @class Authenticator
 * @since 3.0.0
 * @author Gerald Yeo
 * @license MIT
 */
class Authenticator extends TOTP {

  constructor() {
    super();
  }

  encode = encodeKey
  decode = decodeKey
  keyuri = keyuri

  generate(secret) {
    return token(secret, this.options);
  }

  generateSecret(len = 16) {
    return secretKey(len)
  }

  check(token, secret){
    return totpCheck(token, secret, this.options);
  }
}

export default Authenticator;
