/**
 *
 * OTP Utilities
 *
 * @since 3.0.0
 * @author Gerald Yeo <contact@fusedthought.com>
 * @license MIT
 *
 */
export default class OTPUtils {

  /**
   * Simple comparison of 2 tokens
   *
   * @static
   *
   * @param {string} token1 - value
   * @param {string} token2 - value to compare
   *
   * @return {boolean}
   */
  static isSameToken(token1, token2) {
    return (parseInt(token1) === parseInt(token2));
  }




  /**
   * Converts a string to Hex value
   *
   * @static
   *
   * @param {string} value - the string value to convert
   *
   * @return {string}
   */
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




  /**
   * Converts Hex into an Integer
   *
   * @static
   *
   * @param {string} value - the hex value to convert
   *
   * @return {string}
   */
  static hexToInt(hex) {
    return parseInt(hex, 16);
  }




  /**
   * Parses a number into an Integer and converts to it to Hex value
   *
   * @static
   *
   * @param {number|string} num - the number to convert to hex
   *
   * @return {string}
   */
  static intToHex (num) {
    return parseInt(num).toString(16);
  }




  /**
   * Do a left padding of the value based on the total
   *
   * @static
   *
   * @param {integer} num - the number to convert to hex
   *
   * @return {string}
   */
  static pad(value, total = 0) {

    /* Convert to string */
    value = value + '';

    /* Padding */
    while (value.length < total){
      value = '0' + value;
    }

    return value;
  }




  /**
   * Naive secret key generation tool
   *
   * @static
   *
   * @param {integer} length - the key length
   *
   * @return {string}
   */
  static generateSecret(length = 16) {
    let random = '';

    for (let i = 0; i < length; i++){
      random += Math.random().toString(26).slice(2, 3);
    }

    return random;
  }




  /**
   * Removes all spaces
   *
   * @static
   *
   * @param {string} value - string to parse
   *
   * @return {string}
   */
  static removeSpaces(value = '') {
    return value.replace(/\s+/g, '');
  }




  /**
   * Divides number/string into defined quantity per set
   *
   * @static
   *
   * @param {string} value - string value to split
   * @param {integer} num - quantity per set
   *
   * @return {string}
   */
  static setsOf(value, num = 4) {
    let regex = new RegExp('.{1,' + num + '}', 'g');
    value = value + '';

    return (value) ? value.match(regex).join(' ') : '';
  }
}



