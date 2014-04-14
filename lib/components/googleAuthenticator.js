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
 *   secret := base32decode(secret)
 *   message := floor(current Unix time / 30)
 *   hash := HMAC-SHA1(secret, message)
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




/*
 *  Libraries
 */
var otplib = require('./otplib'),
    base32 = require('thirty-two');






/*
 *  Google OTP Auth Object
 */
var googleAuthenticator = {

  // Set debug messages
  debug: function debug(status) {
    otplib.debug = status;
  },


  // Generate the secret
  secret: function secret() {
    var _secret = otplib.secret.generate();
    return this.encode(_secret);
  },


  // Identifier
  // eg: outauth://totp/user:localhost?secet=NKEIBAOUFA
  keyuri: function uri(user, service, secret) {

    var _user = user || 'user',
        _service = service || 'service',
        _secret = secret || '',
        _data = '%service:%user?secret=%secret',
        _protocol = 'otpauth://totp/';

    // Ensure Unifromity
    _secret = _secret.toUpperCase();

    // Repalce string
    _data = _data.replace('%user', _user);
    _data = _data.replace('%service', _service);
    _data = _data.replace('%secret', _secret);

    return encodeURIComponent(_protocol + _data);
  },


  // Generates a QR Code image using Google Charts
  qrcode: function qrcode(user, service, secret) {
    var _uri = this.keyuri(user, service, secret),
        _link = 'https://chart.googleapis.com/chart?cht=qr&chs=150x150&choe=UTF-8&chld=M|0&chl=%uri';

    _link = _link.replace('%uri', _uri);

    return _link;
  },


  // Generate OTP
  generate: function generate(secret) {
    var _secret = this.decode(secret),
        _code = otplib.totp(_secret);

    return _code;
  },


  // Check for token validity
  check: function check(token, secret) {
    var _systemToken = this.generate(secret);

    return (_systemToken === token) ? true : false;
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
