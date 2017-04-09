import crypto from 'crypto';
import encodeKey from './encodeKey';

/**
 * Generates a authenticator compatible secret key
 *
 * @module impl/authenticator/secretKey
 * @param {number} length - length of secret (default: 20)
 * @return {string} secret key
 */
function secretKey(length = 20) {
  const secret = crypto.randomBytes(length);
  return encodeKey(secret);
}

export default secretKey;
