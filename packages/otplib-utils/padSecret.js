/**
 * Padding of secret to a certain buffer size.
 *
 * @module otplib-utils/padSecret
 * @param {Buffer} secretBuffer - a buffer representation of your secret.
 * @param {number} size - number of bytes your secret should be.
 * @param {string} encoding - the encoding of secret
 * @return {Buffer}
 */
function padSecret(secretBuffer, size, encoding) {
  const secret = secretBuffer.toString(encoding);
  const len = secret.length;

  if (size && len < size) {
    const newSecret = new Array((size - len) + 1).join(secretBuffer.toString('hex'));
    return new Buffer(newSecret, 'hex').slice(0, size);
  }

  return secretBuffer;
}

export default padSecret;
