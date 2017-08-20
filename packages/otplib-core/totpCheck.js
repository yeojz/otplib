import {isSameToken} from 'otplib-utils';
import totpToken from './totpToken';

/**
 * Checks the provided OTP token against system generated token
 *
 * @module otplib-core/totpCheck
 * @param {string} token - the OTP token to check
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - options which was used to generate it originally
 * @return {boolean}
 */
function totpCheck(token, secret, options = {}){
  const systemToken = totpToken(secret, options || {});

  if (systemToken.length < 1) {
    return false;
  }

  return isSameToken(token, systemToken);
}

export default totpCheck;
