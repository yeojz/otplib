/**
 * Do a left padding of the value based on the total
 *
 * @method leftPad
 *
 * @param {integer} value - the value to pad
 * @return {string}
 */
function leftPad(value, total = 0) {

  let padded = value + '';

  while (padded.length < total){
    padded = '0' + padded;
  }

  return padded;
}

export default leftPad;
