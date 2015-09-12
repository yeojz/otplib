
/**
 * v3 to v2 adapter
 *
 * This file provides method mappings between
 * version 3 and version 2 of the library.
 *
 * @since 3.0.0
 */




import HOTP from './classes/HOTP';
import TOTP from './classes/TOTP';
import Authenticator from './classes/Authenticator';
import OTPUtils from './classes/OTPUtils';



let hotp = new HOTP();
let totp = new TOTP();
let authenticator = new Authenticator();





/**
 * Helpers
 * --------------------------------------------------------
 */
function checkTOTP(token, secret) {
  if (this.test){
    totp.options({
      epoch: arguments[2]
    });
  }
  let systemToken = totp.generate(secret);
  return OTPUtils.isSameToken(token, systemToken);
}

function checkHOTP(token, secret, counter = 0) {
  let systemToken = hotp.generate(secret, counter);
  return OTPUtils.isSameToken(token, systemToken);
}




/**
 * Core
 * --------------------------------------------------------
 */
let Core = function(){

  this.test = false;

  this.digits = 6;
  this.step = 30;

  this.epoch = null;
  this.utils = OTPUtils;
};

Core.prototype.hotp = hotp.generate;
Core.prototype.totp = totp.generate;
Core.prototype.checkTOTP = checkTOTP;
Core.prototype.checkHOTP = checkHOTP;

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
 * --------------------------------------------------------
 */
let Goog = function() {
  this.digits = 6;
  this.step = 30;
};
Goog.prototype.secret = authenticator.generateSecret;
Goog.prototype.keyuri = authenticator.keyuri;
Goog.prototype.qrcode = authenticator.qrcode;
Goog.prototype.generate = authenticator.generate;
Goog.prototype.check = checkTOTP;
Goog.prototype.encode = authenticator.encode;
Goog.prototype.decode = authenticator.decode;




/**
 * Export
 * --------------------------------------------------------
 */
export default {
  core: new Core(),
  google: new Goog()
};
