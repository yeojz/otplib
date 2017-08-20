/**
 * Converts a string to Hex value
 *
 * @module otplib-utils/stringToHex
 * @param {string} value - the string value to convert
 * @return {string}
 */
function stringToHex(value) {
  const val = value == null ? '' : value;

  let hex = '';
  let tmp = '';

  for (let i = 0; i < val.length; i++){
    // Convert to Hex and Ensure it's in 2 digit sets
    tmp = ('0000' + val.charCodeAt(i).toString(16)).slice(-2);
    hex += '' + tmp;
  }

  return hex;
}

export default stringToHex;
