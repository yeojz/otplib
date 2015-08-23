

import base32 from 'thirty-two';
import OTPUtils from './OTPUtils';
import TOTP from './TOTP';




/**
 *
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
 * @extends {TOTP}
 * @since 3.0.0
 * @author Gerald Yeo
 * @license MIT
 *
 */
export default class Authenticator extends TOTP {

  /**
   * Creates the instance
   */
  constructor() {
    super();

    /**
     * @type {string}
     */
    this.chart = 'https://chart.googleapis.com/chart?cht=qr&chs=150x150&choe=UTF-8&chld=M|0&chl=%uri';

    /**
     * @type {number}
     */
    this.step = 30;
  }




  /**
   * Option Setter
   *
   * @method options
   *
   * @param {Object} opt - custom options
   */
  options(opt = {}) {
    super.options(opt);
    this.chart = opt.chart || this.chart;
  }




  /**
   * Generates an otpauth uri
   *
   * @method keyuri
   *
   * @param {string} user - the name/id of your user
   * @param {string} service - the name of your service
   * @param {string} secret - your secret that is used to generate the token
   * @return {string} otpauth uri. Example: otpauth://totp/user:localhost?secet=NKEIBAOUFA
   */
  keyuri(user = 'user', service = 'service', secret = '') {

    let data = '%service:%user?secret=%secret&issuer=%service';
    let protocol = 'otpauth://totp/';

    data = data.replace('%user', user);
    data = data.replace('%secret', secret);
    data = data.replace(/%service/g, service);

    return encodeURIComponent(protocol + data);
  }




  /**
   * Generates a QR Code image
   *
   * By default, it uses Google Charts as it's charting tool
   *
   * @method qrcode
   *
   * @param {string} user - the name/id of your user
   * @param {string} service - yhe name of your service
   * @param {string} secret - your secret that is used to generate the token
   * @return {string} the QR code image url
   */
  qrcode(user, service, secret) {
    let uri = this.keyuri(user, service, secret);
    let chart = this.chart;

    chart = chart.replace('%uri', uri);

    return chart;
  }




  /**
   * Encodes secret into base32
   *
   * @method encode
   *
   * @param {string} secret - your secret that is used to generate the token
   * @param {string} format - any format supported by node's `Buffer`
   * @return {string} Base32 string
   */
  encode(secret, format = 'binary') {
    return base32.encode(secret).toString(format);
  }




  /**
   * Decodes base32 value to secret.
   *
   * @method decode
   *
   * @param {string} eSecret - your secret that is used to generate the token
   * @param {string} format - any format supported by node's `Buffer`
   * @return {string} Decoded string
   */
  decode(eSecret, format = 'binary') {
    return base32.decode(eSecret).toString(format);
  }




  /**
   * Generates the OTP code
   *
   * @method generate
   *
   * @param {string} secret - your secret that is used to generate the token
   * @return {number} OTP Code
   */
  generate(secret) {
    secret = this.decode(secret);

    let code = super.generate(secret);
    return code;
  }




  /**
   * Generates a secret key
   *
   * @method generateSecret
   *
   * @param {number} len - length of secret (default: 16)
   * @return {string} secret key
   */
  generateSecret(len = 16) {
    let secret = '';

    while (secret.length < len){
      secret += OTPUtils.generateSecret(40, 'base64');
    }

    return this.encode(secret).slice(0, len);
  }

}


