/*
 * otplib - Google Authenticator
 * http://github.com/yeojz/otplib
 *
 * Copyright (c) 2014 Gerald Yeo
 * Licensed under the MIT license.
 *
 *
 * Reference
 * --------------------------
 *   - http://en.wikipedia.org/wiki/Google_Authenticator
 *
 * Google Authenticator
 * --------------------------
 *   key := base32decode(secret)
 *   message := floor(current Unix time / 30)
 *   hash := HMAC-SHA1(key, message)
 *   offset := last nibble of hash
 *   truncatedHash := hash[offset..offset+3]  //4 bytes starting at the offset
 *   Set the first bit of truncatedHash to zero  //remove the most significant bit
 *   code := truncatedHash mod 1000000
 *   pad code with 0 until length of code is 6
 *   return code
 *
 *
 */

'use strict';





var otplib = require('./otplib'),
    base32 = require('thirty-two');







var googleAuthenticator = {

  // Set debug messages
  debug: function debug(status) {
    otplib.debug = status;
  },


  // Generate the secret
  secret: function secret() {
    var secret = otplib.secret.generate();
    return this.encode(secret);
  },


  // Retrive QR code
  qrcode: function qrcode(user, host, secret) {
    var secret = this.secret(),
        uri = otplib.details.uri(user, host, secret);

    return otplib.details.qrcode(uri);
  },


  // Generate OTP
  generate: function generate(secret) {
    var key = this.decode(secret),
        code = otplib.totp(key);

    return code;
  },


  // Check for token validity
  check: function check(token, secret) {
    var systemToken = this.generate(secret);

    return (systemToken === token) ? true : false;
  },


  // Base32 encoding
  encode: function encode(secret) {
    return base32.encode(secret).toUpperCase();
  },


  // Base32 decoding
  decode: function decode(secret) {
    return base32.decode(secret).toUpperCase();
  }

}



module.exports = googleAuthenticator;
