/**
 * Simple comparison of 2 tokens
 *
 * @module otplib-utils/isSameToken
 * @param {string} token1 - base value
 * @param {string} token2 - value to compare
 * @return {boolean}
 */
function isSameToken(token1, token2) {
  return parseFloat(token1) === parseFloat(token2);
}

export default isSameToken;
