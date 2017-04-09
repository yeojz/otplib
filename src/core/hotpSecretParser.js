/**
 * Conversion of secret to buffer for HOTP
 *
 * @module core/hotpSecretParser
 * @param {string} secret - your secret that is used to generate the token
 * @param {string} options.encoding - the encoding of secret
 * @return {object}
 */
function hotpSecretParser(secret, options) {
  return new Buffer(secret, options.encoding);
}
export default hotpSecretParser;
