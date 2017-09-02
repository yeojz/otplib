import {isSameToken} from 'otplib-utils';
import hotpToken from './hotpToken';

/**
 * Checks the provided OTP token against system generated token
 *
 * @module otplib-core/hotpCheck
 * @param {string} token - the OTP token to check
 * @param {string} secret - your secret that is used to generate the token
 * @param {number} counter - the OTP counter (usually it's an incremental count)
 * @param {object} options - options which was used to generate it originally
 * @return {boolean}
 */
function hotpCheck(token, secret, counter, options = {}) {
  const systemToken = hotpToken(secret, counter, options);

  if (systemToken.length < 1) {
    return false;
  }

  return isSameToken(token, systemToken);
}

export default hotpCheck;
