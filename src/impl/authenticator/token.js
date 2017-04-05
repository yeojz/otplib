import totpToken from '../../core/totpToken';
import decodeKey from './decodeKey';

/**
 * Generates the Authenticator OTP code
 *
 * @module impl/authenticator/token
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - additional options.
 * @return {number} OTP Code
 */
function token(secret, options = {}) {
  return totpToken(decodeKey(secret), options);
}

export default token;
