import totpToken from '../../core/totpToken';
import hotpSecret from '../../core/hotpSecret';
import decodeKey from './decodeKey';

/**
 * Generates the Authenticator OTP code
 *
 * @module impl/authenticator/token
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - additional options.
 * @return {number} OTP Code
 */
function token(secret, options) {
  const opt = {
    createHmacSecret: hotpSecret,
    ...options
  }
  return totpToken(decodeKey(secret, opt.keyEncoding), opt);
}

export default token;
