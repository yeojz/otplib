/**
 * Naive secret key generation tool
 *
 * @module otplib-utils/secretKey
 *
 * @param {integer} length - the key length
 * @param {string} format - any format supported by node's `crypto`
 * @return {string}
 */
function secretKey(length, options = {}) {
  if (!length || length < 1){
    return '';
  }

  if (!options.crypto || typeof options.crypto.randomBytes !== 'function') {
    throw new Error('Expecting options.crypto to have a randomBytes function');
  }

  return options.crypto.randomBytes(length)
    .toString('base64') // convert format
    .slice(0, length); // return required number of characters
}

export default secretKey;
