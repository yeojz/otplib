/**
 *
 */

 /**
  * randomBytes browser implementation.
  * https://github.com/crypto-browserify/randombytes
  *
  * @module utils/randomBytes
  * @param {string} size - the size
  * @return {string}
  */
const crypto = global.crypto || global.msCrypto

function randomBytes(size) {
  // phantomjs needs to throw
  if (size > 65536) {
    throw new Error('requested too many random bytes');
  }
  // in case browserify  isn't using the Uint8Array version
  const rawBytes = new global.Uint8Array(size);

  // This will not work in older browsers.
  // See https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
  if (size > 0) {  // getRandomValues fails on IE if size == 0
    crypto.getRandomValues(rawBytes);
  }
  // phantomjs doesn't like a buffer being passed here
  return new Buffer(rawBytes.buffer);
}

export default randomBytes;
