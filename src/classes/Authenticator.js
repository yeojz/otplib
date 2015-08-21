/**
 *
 * Authenticator - Google Authenticator adapter
 *
 * References
 * --------------------------
 * - http://en.wikipedia.org/wiki/Google_Authenticator
 *
 * Algorithm
 * --------------------------
 *  secret := base32decode(secret)
 *  message := floor(current Unix time / 30)
 *  hash := HMAC-SHA1(secret, message)
 *  offset := last nibble of hash
 *  truncatedHash := hash[offset..offset+3]  //4 bytes starting at the offset
 *  Set the first bit of truncatedHash to zero  //remove the most significant bit
 *  code := truncatedHash mod 1000000
 *  pad code with 0 until length of code is 6
 *  return code
 *
 */

import base32 from 'thirty-two';
import TOTP from './TOTP';


// Class Definition
// --------------------------------------------------------
class Authenticator extends TOTP {

  constructor() {
    super();

    this.chart = 'https://chart.googleapis.com/chart?cht=qr&chs=150x150&choe=UTF-8&chld=M|0&chl=%uri';
    this.step = 30;
  }


  options(opt = {}) {
    super.options(opt);
    this.chart = opt.chart || this.chart;
  }


  // Identifier
  // eg: otpauth://totp/user:localhost?secet=NKEIBAOUFA
  keyuri(user = 'user', service = 'service', secret = '') {

    let data = '%service:%user?secret=%secret&issuer=%service';
    let protocol = 'otpauth://totp/';

    // Repalce string
    data = data.replace('%user', user);
    data = data.replace('%secret', secret);
    data = data.replace(/%service/g, service);

    return encodeURIComponent(protocol + data);
  }


  // Generates a QR Code image using Google Charts
  qrcode(user, service, secret) {
    let uri = this.keyuri(user, service, secret);
    let chart = this.chart;

    chart = chart.replace('%uri', uri);

    return chart;
  }

  // Base32 encoding
  encode(secret, type = 'binary') {
    return base32.encode(secret).toString(type);
  }


  // Base32 decoding
  decode(secret, type = 'binary') {
    return base32.decode(secret).toString(type);
  }


  // Generate OTP
  generate(secret) {
    secret = this.decode(secret);

    let code = super.generate(secret);
    return code;
  }


  // Generate the secret
  // Common length = 16
  generateSecret(length = 16) {
    let secret = '';

    while (secret.length < length){
      secret += this.utils.generateSecret(40);
    }

    return this.encode(secret).slice(0, length);
  }

}






// Export
// --------------------------------------------------------
export default Authenticator;

