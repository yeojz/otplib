import crypto from 'crypto';
import intToHex from '../utils/intToHex';
import leftPad from '../utils/leftPad';

/**
 * Intermediate HOTP Digests
 *
 * @module core/hotpDigest
 * @param {string} secret - your secret that is used to generate the token
 * @param {number} counter - the OTP counter (usually it's an incremental count)
 * @param {string} algorithm - hmac algorithm
 * @param {string} encoding - the encoding of secret
 * @return {object}
 */
function hotpDigest(secret, counter, encoding, algorithm) {
  // Convert secret to encoding for hmacSecret
  const hmacSecret = new Buffer(secret, encoding);

  // Ensure counter is a buffer or string (for HMAC creation)
  let hexCounter = intToHex(counter);
  hexCounter = leftPad(hexCounter, 16);

  // HMAC creation
  const cryptoHmac = crypto.createHmac(algorithm, hmacSecret);

  // Update HMAC with the counter
  const hmac = cryptoHmac.update(new Buffer(hexCounter, 'hex'))
    .digest('hex');

  return hmac;
}

export default hotpDigest;
