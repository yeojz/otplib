/**
 * Conversion of secret to buffer for HOTP
 *
 * @module otplib-core/hotpSecret
 * @param {string} secret - your secret that is used to generate the token
 * @param {string} options.encoding - the encoding of secret
 * @return {object}
 */
function hotpSecret(secret, options) {
  return new Buffer(secret, options.encoding);
}

export default hotpSecret;
