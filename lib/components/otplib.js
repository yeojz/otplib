/*
 * otplib - One-Time Password Library
 * http://github.com/yeojz/otplib
 *
 * Copyright (c) 2014 Gerald Yeo
 * Licensed under the MIT license.
 *
 *
 * Reference
 * --------------------------
 *   - http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm
 *   - http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm
 *   - http://tools.ietf.org/html/rfc4226
 *   - http://tools.ietf.org/html/rfc6238
 *
 *
 * HOTP
 * --------------------------
 *   Let:
 *    - K be a secret key
 *    - C be a counter
 *    - HMAC(K,C) = SHA1(K & 0x5c5c... | SHA1(K & 0x3636... | C))
 *      be an HMAC calculated with the SHA-1 cryptographic hash algorithm
 *    - Truncate be a function that selects 4 bytes from the result of the
 *      HMAC in a defined manner
 *    - HOTP(K,C) = Truncate(HMAC(K,C)) & 0x7FFFFFFF
 *    - HOTP-Value = HOTP(K,C) mod 10d, where d is the desired number of digits
 *
 *
 * TOTP
 * --------------------------
 *   Let:
 *    - T0 be an epoch
 *    - TS be the time stemp
 *    - TC be the current timestamp turned into an int, using defined T0, counting in TS units
 *    - TC = (unixtime(now) - unixtime(T0)) / TS
 *    - TOTP = HOTP(SecretKey, TC), where the HOTP algorithm is defined below.
 *    - TOTP-Value = TOTP mod 10d, where d is the desired number of digits of the one-time password.
 *
 */

'use strict';




/*
 *  Libraries
 */
var cryptoHmac = require('crypto');
//var cryptoHmac = require('jssha');








/*
 *  Initialization
 */
var otplib = function otplib() {

  // Final OTP Length
  this.digits = 6;

  // Seconds (TOTP)
  this.timeStep = 30;

  // Console log debug messages
  this.debug = false;
}









/*
 *  HMAC based OTP
 */
otplib.prototype.hotp = function hotp(key, counter) {

      // Convert to hex
  var key = this.helpers.stringToHex(key),

      // Must be either a buffer or string for hmac fx
      counter = this.helpers.intToHex(counter),
      counter = this.helpers.pad(counter, 16),

      // Prepare Cipher
      // Create HMAC
      // SHA1 -> 160 bits, 40 char hex length, 1 char = 4bits

      // jssha library
      // crypto = new cryptoHmac(counter, 'HEX'),
      // hmac = crypto.getHMAC(key, 'HEX', 'SHA-1', 'HEX'),

      // crypto library
      crypto = cryptoHmac.createHmac('sha1', new Buffer(key, 'hex')),
      hmac = crypto.update(new Buffer(counter, 'hex')).digest('hex'),

      // offset := last nibble of hash
      offset = this.helpers.hexToInt(hmac.substr(hmac.length-1)),

      // truncatedHash := hash[offset..offset+3]  //4 bytes starting at the offset
      truncatedHash = hmac.substr(offset*2, 8),

      // Set the first bit of truncatedHash to zero  //remove the most significant bit
      sigbit0 = this.helpers.hexToInt(truncatedHash) & this.helpers.hexToInt('7fffffff'),

      // code := truncatedHash mod 1000000
      code = sigbit0 % Math.pow(10, this.digits);


  // pad code with 0 until length of code is 6
  code = this.helpers.pad(code, this.digits);


  if (this.debug){
    console.log(' hex : ' + key);
    console.log(' epoch : ' + counter);
    console.log(' hmac : ' + hmac);
    console.log(' token : ' + code);
  }


  return code;
}










/*
 *  Time based OTP
 */
otplib.prototype.totp = function totp(key) {


  // Current System Time (T0)
  var epoch = new Date().getTime(),

      // Time in Seconds (TS)
      timeStep = this.timeStep,

      // The Counter for HOTP (TC)
      timeCounter = Math.floor(epoch / (timeStep * 1000.0)),

      // Send it over to HOTP
      totp = this.hotp(key, timeCounter);


  if (this.debug){
    console.log(' time : ' + timeCounter);
  }

  return totp;
}
















/*
 *  Uttilities to management keys
 */
otplib.prototype.secret = {

  // Generate a random key
  // Key length must be multiples of 5 to prevent "=" padding from encoding
  generate: function generate(radix) {

    var radix = radix || 26,
        random = Math.random()          // Maths random -> maybe use something else if possible
                      .toString(radix)  // Corresponds to length
                      .slice(2);        // Get floating point


    // Ensuring base32 encoding without padding
    var padding = random.length % 5;
    random = random.slice(0, random.length-padding);

    return random.toUpperCase();
  }


}









/*
 *  Details for user
 */
otplib.prototype.details = {

    uri: function uri(user, host, secret) {

      var user = user || 'user',
          host = host || 'host',
          secret = secret || '',
          data = '%user:%host?secret=%secret',
          protocol = 'otpauth://totp/';

      // Ensure Unifromity
      secret = secret.toUpperCase();

      // Repalce string
      data = data.replace('%user', user);
      data = data.replace('%host', host);
      data = data.replace('%secret', secret);

      return encodeURIComponent(protocol + data);
    },



    qrcode: function qrcode(uri) {

      var link = 'https://chart.googleapis.com/chart?cht=qr&chs=150x150&choe=UTF-8&chld=M|0&chl=%uri';
      link = link.replace('%uri', uri);

      return link;

    }
}








/*
 *  Helpers (mostly for internal use)
 */
otplib.prototype.helpers = {


  // Converts String to Hex
  stringToHex: function stringToHex(value) {
    var hex = '';

    for (var i = 0; i < value.length; i++){
      hex += '' + value.charCodeAt(i).toString(16);
    }

    return hex;
  },


  // Converts Hex into an Integer
  hexToInt: function hexToInt(hex) {
    return parseInt(hex, 16);
  },


  // Parse number into an Integer and convert to Hex
  intToHex: function intToHex(number) {
    return parseInt(number).toString(16);
  },


  // Do a left padding of the value based on the total
  pad: function pad(value, total) {
    // Convert to string
    var value = value + '',
        total = total || 0;

    // pad
    while (value.length < total){
      value = '0' + value;
    }

    return value;
  }


}




module.exports = new otplib();
