import hexToInt from '../utils/hexToInt';
import intToHex from '../utils/intToHex';
import isSameToken from '../utils/isSameToken';
import leftPad from '../utils/leftPad';
import removeSpaces from '../utils/removeSpaces';
import secretKey from '../utils/secretKey';
import setsOf from '../utils/setsOf';
import stringToHex from '../utils/stringToHex';

/**
 * OTP Utilities
 *
 * @class OTPUtils
 * @since 3.0.0
 * @author Gerald Yeo
 * @license MIT
 */
class OTPUtils {

  /**
   * @see {@link module:utils/hexToInt} for more information.
   */
  static hexToInt(...args) {
    return hexToInt(...args)
  }

  /**
   * @see {@link module:utils/intToHex} for more information.
   */
  static intToHex(...args) {
    return intToHex(...args)
  }

  /**
   * @see {@link module:utils/isSameToken} for more information.
   */
  static isSameToken(...args) {
    return isSameToken(...args)
  }

  /**
   * @see {@link module:utils/leftPad} for more information.
   */
  static pad(...args) {
    return leftPad(...args)
  }

  /**
   * @see {@link module:utils/removeSpaces} for more information.
   */
  static removeSpaces(...args) {
    return removeSpaces(...args)
  }

  /**
   * @see {@link module:utils/secretKey} for more information.
   */
  static generateSecret(...args) {
    return secretKey(...args)
  }

  /**
   * @see {@link module:utils/setsOf} for more information.
   */
  static setsOf(...args) {
    return setsOf(...args)
  }

  /**
   * @see {@link module:utils/stringToHex} for more information.
   */
  static stringToHex(...args) {
    return stringToHex(...args)
  }
}

export default OTPUtils;
