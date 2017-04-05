import decodeKey from '../authenticator/decodeKey';
import encodeKey from '../authenticator/encodeKey';
import keyuri from '../authenticator/keyuri';
import qrcode from '../authenticator/qrcode';
import secretKey from '../authenticator/secretKey';
import token from '../authenticator/token';

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
class Authenticator {

    constructor() {
      this.opt = {
        chart: 'https://chart.googleapis.com/chart?cht=qr&chs=150x150&choe=UTF-8&chld=M|0&chl=%uri',
        epoch: null,
        step: 30,
        tokenLength: 6
      }
    }

    options(opt = {}) {

      // Note:
      // only opt.chart
      // all other options are not allowed to be overwritten
      // since it should follow google authenticator formats.
      this.opt.chart = opt.chart || this.opt.chart;
    }

    encode = encodeKey
    decode = decodeKey
    keyuri = keyuri

    qrcode(user, service, secret) {
      return qrcode(user, service, secret, this.opt);
    }

    generate(secret) {
      return token(secret, this.opt);
    }

    generateSecret(len = 16) {
      return secretKey(len)
    }
}

export default Authenticator;
