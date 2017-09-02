import base32 from 'thirty-two';

/**
 * Encodes secret into base32
 *
 * @module otplib-authenticator/encodeKey
 * @param {string} secret - your secret that is used to generate the token
 * @return {string} Base32 string
 */
function encodeKey(secret) {
  return base32.encode(secret)
    .toString()
    .replace(/=/g, '');
}

export default encodeKey;
