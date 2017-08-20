import {hexToInt, leftPad} from 'otplib-utils';
import hotpDigest from './hotpDigest';
import hotpOptions from './hotpOptions';

/**
 * Generates the OTP code
 *
 * @module otplib-core/hotpToken
 * @param {string} secret - your secret that is used to generate the token
 * @param {number} counter - the OTP counter (usually it's an incremental count)
 * @param {object} options - allowed options as specified in hotpOptions()
 * @return {string} OTP Code
 */
function hotpToken(secret, counter, options = {}) {
  if (counter == null) {
    return '';
  }

  const opt = hotpOptions(options);
  const hmac = hotpDigest(secret, counter, opt);

  // offset := last nibble of hash
  const offset = hexToInt(hmac.substr(hmac.length - 1));

  // truncatedHash := hash[offset..offset+3]
  // (4 bytes starting at the offset)
  const truncatedHash = hmac.substr(offset * 2, 8);

  // Set the first bit of truncatedHash to zero
  // (i.e. remove the most significant bit)
  const sigbit0 = hexToInt(truncatedHash) & hexToInt('7fffffff');

  // code := truncatedHash mod 1000000
  let token = sigbit0 % Math.pow(10, opt.digits);

  // left pad code with 0 until length of code is as defined.
  token = leftPad(token, opt.digits);

  return token;
}

export default hotpToken;
