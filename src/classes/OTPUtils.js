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
  static hexToInt = hexToInt;
  static intToHex = intToHex;
  static isSameToken = isSameToken;
  static pad = leftPad;
  static removeSpaces = removeSpaces;
  static generateSecret = secretKey;
  static setsOf = setsOf;
  static stringToHex = stringToHex;
}

export default OTPUtils;
