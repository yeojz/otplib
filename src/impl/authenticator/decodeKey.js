import base32 from 'thirty-two';

/**
 * Decodes base32 value to secret.
 *
 * @module impl/authenticator/decodeKey
 * @param {string} encodedKey - your encoded secret that is used to generate the token
 * @return {string} Decoded string
 */
function decodeKey(encodedKey) {
  return base32.decode(encodedKey);
}

export default decodeKey;
