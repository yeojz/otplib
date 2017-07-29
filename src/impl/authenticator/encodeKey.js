import base32 from 'thirty-two';

/**
 * Encodes secret into base32
 *
 * @module impl/authenticator/encodeKey
 * @param {string} secret - your secret that is used to generate the token
 * @param {string} format - any format supported by node's `Buffer`
 * @return {string} Base32 string
 */
function encodeKey(secret, format) {
  const fmt = format || 'ascii';

  return base32.encode(secret)
    .toString(fmt);
}

export default encodeKey;
