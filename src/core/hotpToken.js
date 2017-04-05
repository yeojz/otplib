import crypto from 'crypto';
import hexToInt from '../utils/hexToInt';
import intToHex from '../utils/intToHex';
import leftPad from '../utils/leftPad';
import stringToHex from '../utils/stringToHex';
import hotpOptions from './hotpOptions';

/**
 * Generates the OTP code
 *
 * @module core/hotpToken
 * @param {string} secret - your secret that is used to generate the token
 * @param {number} counter - the OTP counter (usually it's an incremental count)
 * @param {object} options - additional options. eg: digits
 * @return {number} OTP Code
 */
function hotpToken(secret, counter, options = {}) {
  const opt = hotpOptions(options);

  // Convert secret to hex
  const hexSecret = stringToHex(secret);

  // Ensure counter is a buffer or string (for HMAC creation)
  let hexCounter = intToHex(counter);
  hexCounter = leftPad(hexCounter, 16);

  // HMAC creation
  const cryptoHmac = crypto.createHmac('sha1', new Buffer(hexSecret, 'hex'));

  // Update HMAC with the counter
  const hmac = cryptoHmac.update(new Buffer(hexCounter, 'hex')).digest('hex');

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
