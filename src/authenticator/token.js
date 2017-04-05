import totpToken from '../core/totpToken';
import decodeKey from './decodeKey';

/**
 * Generates the Authenticator OTP code
 *
 * @method token
 *
 * @param {string} secret - your secret that is used to generate the token
 * @return {number} OTP Code
 */
function token(secret) {
  return totpToken(decodeKey(secret));
}

export default token;
