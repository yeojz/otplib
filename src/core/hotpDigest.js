import crypto from 'crypto';
import hotpCounter from './hotpCounter';

function padSecret(secret, size) {
  const len = secret.length;
  if (size && len < size) {
    const newSecret = new Array((size - len) + 1).join(secret.toString('hex'));
    return new Buffer(newSecret, 'hex').slice(0, size);
  }
  return secret;
}

function createHmacSecret(secret, algorithm) {
  // if (algorithm === 'sha1') {
  //   return padSecret(secret, 20);
  // }
  if (algorithm === 'sha256') {
    return padSecret(secret, 32);
  }
  if (algorithm === 'sha512') {
    return padSecret(secret, 64);
  }
  return secret;
}

/**
 * Intermediate HOTP Digests
 *
 * @module core/hotpDigest
 * @param {string} secret - your secret that is used to generate the token
 * @param {number} counter - the OTP counter (usually it's an incremental count)
 * @param {string} algorithm - hmac algorithm
 * @param {string} encoding - the encoding of secret
 * @return {object}
 */
function hotpDigest(secret, counter, encoding, algorithm) {

  // Convert secret to encoding for hmacSecret
  const hmacSecret = createHmacSecret(
    new Buffer(secret, encoding.toLowerCase()),
    algorithm.toLowerCase()
  );

  // Ensure counter is a buffer or string (for HMAC creation)
  const hexCounter = hotpCounter(counter);

  // HMAC creation
  const cryptoHmac = crypto.createHmac(algorithm, hmacSecret);

  // Update HMAC with the counter
  const hmac = cryptoHmac.update(new Buffer(hexCounter, 'hex'))
    .digest('hex');

  return hmac;
}

export default hotpDigest;
