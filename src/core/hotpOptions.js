import hotpSecretParser from './hotpSecretParser';

/**
 * Generates options for HOTP
 *
 * @module core/hotpOptions
 * @param {number} options.digits - the output token length
 * @param {string} options.encoding - the encoding of secret
 * @return {object}
 */
function hotpOptions(options = {}) {
  return {
    algorithm: 'sha1',
    createHmacSecret: hotpSecretParser,
    digits: 6,
    encoding: 'ascii',
    ...options
  }
}

export default hotpOptions;
