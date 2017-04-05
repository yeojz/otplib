/**
 * Simple comparison of 2 tokens
 *
 * @method isSameToken
 *
 * @param {string} token1 - base value
 * @param {string} token2 - value to compare
 * @return {boolean}
 */
function isSameToken(token1, token2) {
  return parseInt(token1, 10) === parseInt(token2, 10);
}

export default isSameToken;
