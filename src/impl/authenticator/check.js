import totpCheck from '../../core/totpCheck';
import hotpSecret from '../../core/hotpSecret';
import decodeKey from './decodeKey';

/**
 * Checks the provided OTP token against system generated token
 *
 * @module impl/authenticator/check
 * @param {string} token - the OTP token to check
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - options which was used to generate it originally
 * @return {boolean}
 */
function check(token, secret, options) {
  const opt = {
    ...options,
    createHmacSecret: hotpSecret
  };
  return totpCheck(token, decodeKey(secret, opt.encoding), opt);
}

export default check;
