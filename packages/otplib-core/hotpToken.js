import {leftPad} from 'otplib-utils';
import hotpDigest from './hotpDigest';

/**
 * Generates the OTP code
 *
 * @module otplib-core/hotpToken
 * @param {string} secret - your secret that is used to generate the token
 * @param {number} counter - the OTP counter (usually it's an incremental count)
 * @param {object} options - allowed options as specified in hotpOptions()
 * @return {string} OTP Code
 */
function hotpToken(secret, counter, options) {
  if (counter == null) {
    return ''
  }

  if (typeof options.digits !== 'number') {
    throw new Error('Expecting options.digits to be a number');
  }

  const digest = hotpDigest(secret, counter, options);

  const offset = digest[digest.length - 1] & 0xf;
  const binary = ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  // code := truncatedHash mod 1000000
  let token = binary % Math.pow(10, options.digits);

  // left pad code with 0 until length of code is as defined.
  token = leftPad(token, options.digits);

  return token;
}

export default hotpToken;
