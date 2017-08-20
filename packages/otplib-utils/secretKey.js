/**
 * Naive secret key generation tool
 *
 * @module otplib-utils/secretKey
 *
 * @param {integer} length - the key length
 * @param {string} format - any format supported by node's `crypto`
 * @return {string}
 */
function secretKey(length = 16, options = {}) {
  if (length < 1){
    return '';
  }

  return options.crypto.randomBytes(length)
    .toString('base64') // convert format
    .slice(0, length); // return required number of characters
}

export default secretKey;
