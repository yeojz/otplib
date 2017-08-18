import otplib from 'otplib';
import * as otpUtils from 'otplib-utils';
import crypto from 'crypto';

const hotp = otplib.hotp;
const totp = otplib.totp;
const authenticator = otplib.authenticator;

/**
 * v3 to v2 adapter
 *
 * This file provides method mappings between
 * version 3 and version 2 of the library.
 *
 * @module v2
 * @since 3.0.0
 */

function withOptions(otp, method) {
  return function (...args) {
    otp.options = {
      digits: this.digits,
      epoch: this.epoch == null ? null : this.epoch / 1000,
      step: this.step
    };

    return otp[method](...args);
  }
}

/**
 * Core
 */
function Core() {
  this.digits = 6;
  this.step = 30;
  this.epoch = null;
}

Core.prototype.hotp = withOptions(hotp, 'generate');
Core.prototype.totp = withOptions(totp, 'generate');
Core.prototype.checkTOTP = withOptions(totp, 'check');
Core.prototype.checkHOTP = withOptions(hotp, 'check');
Core.prototype.helpers = {
  isSameToken: otpUtils.isSameToken,
  stringToHex: otpUtils.stringToHex,
  hexToInt: otpUtils.hexToInt,
  intToHex: otpUtils.intToHex,
  pad: otpUtils.leftPad
};
Core.prototype.secret = {
  generate: (len) => otpUtils.secretKey(len, {crypto}),
  removeSpaces: otpUtils.removeSpaces,
  divideIntoSetsOf: otpUtils.setsOf
};

/**
 * Google Authenticator
 */
function Goog() {
  this.digits = 6;
  this.step = 30;
}
Goog.prototype.secret = function (len = 16) {
  let secret = '';
   while (secret.length < len){
     secret += otpUtils.secretKey(40, {crypto});
   }
   return authenticator.encode(secret).slice(0, len);
};
Goog.prototype.keyuri = function(...args) {
  return encodeURIComponent(authenticator.keyuri(...args));
};
Goog.prototype.qrcode = authenticator.qrcode;
Goog.prototype.generate = authenticator.generate;
Goog.prototype.check = withOptions(totp, 'check');
Goog.prototype.encode = authenticator.encode;
Goog.prototype.decode = function(...args) {
  return authenticator.decode(...args).toString();
}

/**
 * Default Exports
 */
export default {
  core: new Core(),
  google: new Goog()
};
