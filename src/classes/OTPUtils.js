

import crypto from 'crypto';




/**
 *
 * OTP Utilities
 *
 * @class OTPUtils
 * @since 3.0.0
 * @author Gerald Yeo
 * @license MIT
 *
 */
export default class OTPUtils {

  /**
   * Simple comparison of 2 tokens
   *
   * @method isSameToken
   * @static
   *
   * @param {string} token1 - value
   * @param {string} token2 - value to compare
   * @return {boolean}
   */
  static isSameToken(token1, token2) {
    return (parseInt(token1) === parseInt(token2));
  }




  /**
   * Converts a string to Hex value
   *
   * @method stringToHex
   * @static
   *
   * @param {string} value - the string value to convert
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
   * @method hexToInt
   * @static
   *
   * @param {string} value - the hex value to convert
   * @return {string}
   */
  static hexToInt(hex) {
    return parseInt(hex, 16);
  }




  /**
   * Parses a number into an Integer and converts to it to Hex value
   *
   * @method intToHex
   * @static
   *
   * @param {number|string} num - the number to convert to hex
   * @return {string}
   */
  static intToHex (num) {
    return parseInt(num).toString(16);
  }




  /**
   * Do a left padding of the value based on the total
   *
   * @method pad
   * @static
   *
   * @param {integer} num - the number to convert to hex
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
   * @method generateSecret
   * @static
   *
   * @param {integer} len - the key length
   * @param {string} format - any format supported by node's `crypto`
   * @return {string}
   */
  static generateSecret(len = 16, format = 'base64') {
    if (len < 1){
      return '';
    }

    let random = crypto.randomBytes(len)
            .toString(format) // convert format
            .slice(0, len); // return required number of characters

    return random;
  }




  /**
   * Removes all spaces
   *
   * @method removeSpaces
   * @static
   *
   * @param {string} value - string to parse
   * @return {string}
   */
  static removeSpaces(value = '') {
    return value.replace(/\s+/g, '');
  }




  /**
   * Divides number/string into defined quantity per set
   *
   * @method setsOf
   * @static
   *
   * @param {string} value - string value to split
   * @param {integer} num - quantity per set
   * @return {string}
   */
  static setsOf(value, num = 4) {
    let regex = new RegExp('.{1,' + num + '}', 'g');
    value = value + '';

    return (value) ? value.match(regex).join(' ') : '';
  }
}



