/**
 * Divides number/string into defined quantity per set
 *
 * @module utils/setsOf
 * @param {string} value - string value to split
 * @param {integer} amount - number of digits per set
 * @param {string} divider - defines how sets are joined.
 * @return {string}
 */
function setsOf(value, amount = 4, divider = ' ') {
  let regex = new RegExp('.{1,' + amount + '}', 'g');
  const str = value + '';

  return (str) ? str.match(regex).join(divider) : '';
}

export default setsOf;
