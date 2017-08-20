import {padSecret} from 'otplib-utils';

/**
 * Conversion of secret to buffer for TOTP
 *
 * Seed for HMAC-SHA1 - 20 bytes
 * Seed for HMAC-SHA256 - 32 bytes
 * Seed for HMAC-SHA512 - 64 bytes
 *
 * @module otplib-core/totpSecret
 * @param {string} secret - your secret that is used to generate the token
 * @param {string} options.algorithm - hmac algorithm
 * @param {string} options.encoding - the encoding of secret
 * @return {object}
 */
function totpSecret(secret, options) {
  const encoded = new Buffer(secret, options.encoding);

  switch (options.algorithm.toLowerCase()) {
    case 'sha1':
      return padSecret(encoded, 20);
    case 'sha256':
      return padSecret(encoded, 32);
    case 'sha512':
      return padSecret(encoded, 64);
    default:
      return encoded;
  }
}

export default totpSecret;
