import base32 from 'thirty-two';

/**
 * Decodes base32 value to secret.
 *
 * @module otplib-authenticator/decodeKey
 * @param {string} encodedKey - your encoded secret that is used to generate the token
 * @return {string} A hex decoded string.
 */
function decodeKey(encodedKey) {
  return base32.decode(encodedKey)
    .toString('hex');
}

export default decodeKey;
