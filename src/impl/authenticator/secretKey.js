import secretKeyUtils from '../../utils/secretKey';
import encodeKey from './encodeKey';

/**
 * Generates a authenticator compatible secret key
 *
 * @module impl/authenticator/secretKey
 * @param {number} length - length of secret (default: 16)
 * @return {string} secret key
 */
function secretKey(length = 16) {

  if (!Number.isInteger(length)) {
    return '';
  }

  let secret = '';

  while (secret.length < length){
    secret += secretKeyUtils(40, 'base64');
  }

  return encodeKey(secret)
    .slice(0, length);
}

export default secretKey;
