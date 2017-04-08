import intToHex from '../utils/intToHex';
import leftPad from '../utils/leftPad';

/**
 * Ensure HOTP counter is in correct format
 *
 * @module core/hotpCounter
 * @param {number} counter - the OTP counter (usually it's an incremental count)
 * @return {string}
 */
function hotpCounter(counter) {
  const hexCounter = intToHex(counter);
  return leftPad(hexCounter, 16);
}

export default hotpCounter;
