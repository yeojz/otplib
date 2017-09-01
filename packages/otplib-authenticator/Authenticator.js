import totp from 'otplib-totp';
import {secretKey} from 'otplib-utils';
import check from './check';
import decodeKey from './decodeKey';
import encodeKey from './encodeKey';
import keyuri from './keyuri';
import token from './token';

const TOTP = totp.TOTP;

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
 * @module otplib-authenticator/Authenticator
 * @extends {TOTP}
 * @since 3.0.0
 */
class Authenticator extends TOTP {

  constructor() {
    super();
  }

  /**
   * getter for defaultOptions
   *
   * @return {object}
   */
  get defaultOptions() {
    return {
      encoding: 'hex',
      epoch: null,
      step: 30,
    }
  }

  /**
   * @see {@link module:impl/authenticator/encodeKey}
   */
  encode(...args) {
    return encodeKey(...args);
  }

  /**
   * @see {@link module:impl/authenticator/decodeKey}
   */
  decode(...args) {
    return decodeKey(...args);
  }

  /**
   * @see {@link module:impl/authenticator/keyuri}
   */
  keyuri(...args) {
    return keyuri(...args);
  }

  /**
   * Generates and encodes a secret key
   *
   * @param {string} length - secret key length (not encoded key length)
   * @return {string}
   * @see {@link module:impl/authenticator/secretKey}
   * @see {@link module:impl/authenticator/encodeKey}
   */
  generateSecret(len = 20) {
    if (!len) {
      return '';
    }
    const secret = secretKey(len, this.options);
    return encodeKey(secret);
  }

  /**
   * @param {string} secret
   * @return {string}
   * @see {@link module:impl/authenticator/token}
   */
  generate(secret) {
    return token(secret, this.options);
  }

  /**
   * Checks validity of token.
   * Passes instance options to underlying core function
   *
   * @param {string} token
   * @param {string} secret
   * @return {boolean}
   * @see {@link module:impl/authenticator/check}
   */
  check(token, secret) {
    return check(token, secret, this.options);
  }
}

Authenticator.prototype.Authenticator = Authenticator;
Authenticator.prototype.utils = {
  check,
  decodeKey,
  encodeKey,
  keyuri,
  token,
}
export default Authenticator;
