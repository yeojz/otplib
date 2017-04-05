import base32 from 'thirty-two';

/**
 * Decodes base32 value to secret.
 *
 * @module impl/authenticator/decodeKey
 * @param {string} encodedKey - your encoded secret that is used to generate the token
 * @param {string} format - any format supported by node's `Buffer`
 * @return {string} Decoded string
 */
function decodeKey(encodedKey, format = 'binary') {
  return base32.decode(encodedKey)
    .toString(format);
}

export default decodeKey;
