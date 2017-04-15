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
   * @see {@link module:utils/hexToInt}
   */
  static hexToInt(...args) {
    return hexToInt(...args)
  }

  /**
   * @see {@link module:utils/intToHex}
   */
  static intToHex(...args) {
    return intToHex(...args)
  }

  /**
   * @see {@link module:utils/isSameToken}
   */
  static isSameToken(...args) {
    return isSameToken(...args)
  }

  /**
   * @see {@link module:utils/leftPad}
   */
  static pad(...args) {
    return leftPad(...args)
  }

  /**
   * @see {@link module:utils/removeSpaces}
   */
  static removeSpaces(...args) {
    return removeSpaces(...args)
  }

  /**
   * @see {@link module:utils/secretKey}
   */
  static generateSecret(...args) {
    return secretKey(...args)
  }

  /**
   * @see {@link module:utils/setsOf}
   */
  static setsOf(...args) {
    return setsOf(...args)
  }

  /**
   * @see {@link module:utils/stringToHex}
   */
  static stringToHex(...args) {
    return stringToHex(...args)
  }
}

export default OTPUtils;
