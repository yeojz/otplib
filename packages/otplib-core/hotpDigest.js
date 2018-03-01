import hotpCounter from './hotpCounter';

/**
 * Intermediate HOTP Digests
 *
 * @module otplib-core/hotpDigest
 * @param {string} secret - your secret that is used to generate the token
 * @param {number} counter - the OTP counter (usually it's an incremental count)
 * @param {string} options.algorithm - hmac algorithm
 * @param {function} options.createHmacSecret - the encoding function for secret
 * @param {string} options.encoding - the encoding of secret
 * @return {string} - hex string
 */
function hotpDigest(secret, counter, options) {
  if (!options.crypto || typeof options.crypto.createHmac !== 'function') {
    throw new Error('Expecting options.crypto to have a createHmac function');
  }

  if (typeof options.createHmacSecret !== 'function') {
    throw new Error('Expecting options.createHmacSecret to be a function')
  }

  if (typeof options.algorithm !== 'string') {
    throw new Error('Expecting options.algorithm to be a string')
  }

  // Convert secret to encoding for hmacSecret
  const hmacSecret = options.createHmacSecret(secret, options);

  // Ensure counter is a buffer or string (for HMAC creation)
  const hexCounter = hotpCounter(counter);

  // HMAC creation
  const cryptoHmac = options.crypto.createHmac(options.algorithm, hmacSecret);

  // Update HMAC with the counter
  return cryptoHmac.update(new Buffer(hexCounter, 'hex'))
    .digest();
}

export default hotpDigest;
