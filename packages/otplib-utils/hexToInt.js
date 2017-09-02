/**
 * Converts Hex into an Integer
 *
 * @module otplib-utils/hexToInt
 * @param {string} value - the hex value to convert
 * @return {string}
 */
function hexToInt(hex) {
  return parseInt(hex, 16);
}

export default hexToInt;
