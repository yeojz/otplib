import {intToHex, leftPad} from 'otplib-utils';

/**
 * Ensure HOTP counter is in correct format
 *
 * @module otplib-core/hotpCounter
 * @param {number} counter - the OTP counter (usually it's an incremental count)
 * @return {string}
 */
function hotpCounter(counter) {
  const hexCounter = intToHex(counter);
  return leftPad(hexCounter, 16);
}

export default hotpCounter;
