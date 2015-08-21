/**
 * otplib
 *
 * One-Time Password Library
 */

import HOTP from './classes/HOTP';
import TOTP from './classes/TOTP';
import Authenticator from './classes/Authenticator';

let authenticator = new Authenticator();
let hotp = new HOTP();
let totp = new TOTP();


export default {
  authenticator,
  hotp,
  totp
};
