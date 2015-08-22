

import base32 from 'thirty-two';
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
   * @param {Object} opt - Custom options
   */
  options(opt = {}) {
    super.options(opt);
    this.chart = opt.chart || this.chart;
  }




  /**
   * Generates an otpauth uri
   *
   * @param {string} user - The name/id of your user
   * @param {string} service - The name of your service
   * @param {string} secret - Your secret that is used to generate the token
   *
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
   * @param {string} user - The name/id of your user
   * @param {string} service - The name of your service
   * @param {string} secret - Your secret that is used to generate the token
   *
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
   * @param {string} secret - Your secret that is used to generate the token
   * @param {string} type - encoding. Any value supported by Node Buffer
   *
   * @return {string} Base32 string
   */
  encode(secret, type = 'binary') {
    return base32.encode(secret).toString(type);
  }




  /**
   * Decodes base32 value to secret.
   *
   * @param {string} eSecret - Your secret that is used to generate the token
   * @param {string} type - encoding. Any value supported by Node Buffer
   *
   * @return {string} Decoded string
   */
  decode(eSecret, type = 'binary') {
    return base32.decode(eSecret).toString(type);
  }




  /**
   * Generates the OTP code
   *
   * @param {string} secret - Your secret that is used to generate the token
   *
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
   * @param {number} length - Length of secret (default: 16)
   *
   * @return {string} secret key
   */
  generateSecret(length = 16) {
    let secret = '';

    while (secret.length < length){
      secret += this.utils.generateSecret(40);
    }

    return this.encode(secret).slice(0, length);
  }

}






/**
 * @type {class}
 */
export default Authenticator;

