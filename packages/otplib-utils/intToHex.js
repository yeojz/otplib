/**
 * Parses a number into an Integer and converts to it to Hex value
 *
 * @module otplib-utils/intToHex
 * @param {number|string} value - the number to convert to hex
 * @return {string}
 */
function intToHex(value) {
  return parseInt(value, 10).toString(16);
}

export default intToHex;
