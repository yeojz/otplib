import { padSecret } from 'otplib-utils';

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
  if (typeof options.algorithm !== 'string') {
    throw new Error('Expecting options.algorithm to be a string');
  }

  if (typeof options.encoding !== 'string') {
    throw new Error('Expecting options.encoding to be a string');
  }

  const encoded = new Buffer(secret, options.encoding);
  const algorithm = options.algorithm.toLowerCase();

  switch (algorithm) {
    case 'sha1':
      return padSecret(encoded, 20, options.encoding);
    case 'sha256':
      return padSecret(encoded, 32, options.encoding);
    case 'sha512':
      return padSecret(encoded, 64, options.encoding);
    default:
      throw new Error(
        `Unsupported algorithm ${algorithm}. Accepts: sha1, sha256, sha512`
      );
  }
}

export default totpSecret;
