import {totpToken} from 'otplib-core';
import decodeKey from './decodeKey';

/**
 * Generates the Authenticator OTP code
 *
 * @module otplib-authenticator/token
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - additional options.
 * @return {number} OTP Code
 */
function token(secret, options) {
  return totpToken(decodeKey(secret), options);
}

export default token;
