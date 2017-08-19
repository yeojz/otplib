import HOTP from './classes/HOTP';
import TOTP from './classes/TOTP';
import Authenticator from './classes/Authenticator';
import OTPUtils from './classes/OTPUtils';

/**
 * v3 to v2 adapter
 *
 * This file provides method mappings between
 * version 3 and version 2 of the library.
 *
 * @module v2
 * @since 3.0.0
 */

let hotp = new HOTP();
let totp = new TOTP();
let authenticator = new Authenticator();

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
  isSameToken: OTPUtils.isSameToken,
  stringToHex: OTPUtils.stringToHex,
  hexToInt: OTPUtils.hexToInt,
  intToHex: OTPUtils.intToHex,
  pad: OTPUtils.pad
};
Core.prototype.secret = {
  generate: OTPUtils.generateSecret,
  removeSpaces: OTPUtils.removeSpaces,
  divideIntoSetsOf: OTPUtils.setsOf
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
     secret += OTPUtils.generateSecret(40, 'base64');
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
