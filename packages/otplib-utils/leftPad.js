/**
 * Do a left padding if value's length less than total
 *
 * @module otplib-utils/leftPad
 * @param {integer} value - the original value
 * @param {integer} length - the total length of the string
 * @return {string}
 */
function leftPad(value, length) {
  const total = (!length) ? 0 : length;

  let padded = value + '';

  while (padded.length < total){
    padded = '0' + padded;
  }

  return padded;
}

export default leftPad;
