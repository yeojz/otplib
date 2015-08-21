/**
 * OTPUtils
 *
 * Common utilities for otp
 */

class OTPUtils {

  // Simple comparison of 2 tokens
  static isSameToken(token1, token2) {
    return (parseInt(token1) === parseInt(token2));
  }


  // Converts a string to Hex value
  static stringToHex(value) {
    let hex = '';
    let tmp = '';

    for (let i = 0; i < value.length; i++){

      // Convert to Hex and Ensure it's in 2 digit sets
      tmp = ('0000' + value.charCodeAt(i).toString(16)).slice(-2);

      // Append
      hex += '' + tmp;
    }

    return hex;
  }


  // Converts Hex into an Integer
  static hexToInt(hex) {
    return parseInt(hex, 16);
  }


  // Parse number into an Integer and convert to Hex
  static intToHex (num) {
    return parseInt(num).toString(16);
  }


  // Do a left padding of the value based on the total
  static pad(value, total = 0) {

    // Convert to string
    value = value + '';

    // Padding
    while (value.length < total){
      value = '0' + value;
    }

    return value;
  }


  // Naive Secret generation tool
  static generateSecret(length = 16) {
    let random = '';

    for (let i = 0; i < length; i++){
      random += Math.random().toString(26).slice(2, 3);
    }

    return random;
  }


  // Strips and replace space values
  static removeSpaces(value = '') {
    return value.replace(/\s+/g, '');
  }


  // Divides number into defined sets
  static setsOf(value, num = 4) {
    let regex = new RegExp('.{1,' + num + '}', 'g');
    value = value + '';

    return (value) ? value.match(regex).join(' ') : '';
  }
}



// Export
// --------------------------------------------------------
export default OTPUtils;
