/**
 *
 * HOTP - HMAC-based One-time Password Algorithm
 *
 * References
 * --------------------------
 * - http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm
 * - http://tools.ietf.org/html/rfc4226
 *
 * Algorithm
 * --------------------------
 * Let:
 *  - K be a secret secret
 *  - C be a counter
 *  - HMAC(K,C) = SHA1(K & 0x5c5c... | SHA1(K & 0x3636... | C))
 *    be an HMAC calculated with the SHA-1 cryptographic hash algorithm
 *  - Truncate be a function that selects 4 bytes from the result of the
 *    HMAC in a defined manner
 *  - HOTP(K,C) = Truncate(HMAC(K,C)) & 0x7FFFFFFF
 *  - HOTP-Value = HOTP(K,C) mod 10d, where d is the desired number of digits
 *
 */

import crypto from 'crypto';

import OTPUtils from './OTPUtils';




// Class Definition
// --------------------------------------------------------
class HOTP {

  constructor() {
    this.utils = OTPUtils;
    this.digits = 6;
  }

  options(opt = {}) {
    this.digits = opt.digits || this.digits;
  }


  // Generates the OTP code
  generate(secret, counter) {

    // Convert to hex
    secret = this.utils.stringToHex(secret);

    // Must be either a buffer or string for hmac fx
    counter = this.utils.intToHex(counter);
    counter = this.utils.pad(counter, 16);

    // Crypto Process
    let cryptoHmac = crypto.createHmac('sha1', new Buffer(secret, 'hex'));
    let hmac = cryptoHmac.update(new Buffer(counter, 'hex')).digest('hex');

    // offset := last nibble of hash
    let offset = this.utils.hexToInt(hmac.substr(hmac.length - 1));

    // truncatedHash := hash[offset..offset+3]  //4 bytes starting at the offset
    let truncatedHash = hmac.substr(offset * 2, 8);

    // Set the first bit of truncatedHash to zero  //remove the most significant bit
    let sigbit0 = this.utils.hexToInt(truncatedHash) & this.utils.hexToInt('7fffffff');

    // code := truncatedHash mod 1000000
    let code = sigbit0 % Math.pow(10, this.digits);

    // pad code with 0 until length of code is 6
    code = this.utils.pad(code, this.digits);

    return code;
  }


  // Token Checker
  check(token, secret, counter = 0) {
    let systemToken = this.generate(secret, counter);
    return this.utils.isSameToken(token, systemToken);
  }
}








// Export
// --------------------------------------------------------
export default HOTP;
