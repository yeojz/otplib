function isValidToken(value) {
  return /^(\d+)(\.\d+)?$/.test(value);
}

/**
 * Simple comparison of 2 tokens
 *
 * @module otplib-utils/isSameToken
 * @param {string | number} token1 - base value
 * @param {string | number} token2 - value to compare
 * @return {boolean}
 */
function isSameToken(token1, token2) {
  if (isValidToken(token1) && isValidToken(token2)) {
    return String(token1) === String(token2);
  }

  return false;
}

export default isSameToken;
