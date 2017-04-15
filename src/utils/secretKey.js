import crypto from 'crypto';

/**
 * Naive secret key generation tool
 *
 * @module utils/secretKey
 *
 * @param {integer} length - the key length
 * @param {string} format - any format supported by node's `crypto`
 * @return {string}
 */
function secretKey(length = 16, format = 'base64') {
  if (length < 1){
    return '';
  }

  return crypto.randomBytes(length)
    .toString(format) // convert format
    .slice(0, length); // return required number of characters
}

export default secretKey;
