import hotpSecret from './hotpSecret';

/**
 * Generates options for HOTP
 *
 * @module otplib-core/hotpOptions
 * @param {number} options.digits - the output token length
 * @param {string} options.encoding - the encoding of secret
 * @return {object}
 */
function hotpOptions(options = {}) {
  return Object.assign({
    algorithm: 'sha1',
    createHmacSecret: hotpSecret,
    crypto: null,
    digits: 6,
    encoding: 'ascii',
  }, options)
}

export default hotpOptions;
