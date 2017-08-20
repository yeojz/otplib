/**
 * Divides number/string into defined quantity per set
 *
 * @module otplib-utils/setsOf
 * @param {string} value - string value to split
 * @param {integer} amount - number of digits per set
 * @param {string} divider - defines how sets are joined.
 * @return {string}
 */
function setsOf(value, amount = 4, divider = ' ') {
  const num = parseInt(amount, 10);

  if (Number.isNaN(num) || typeof value !== 'string') {
    return '';
  }

  const regex = new RegExp('.{1,' + amount + '}', 'g');
  return value.match(regex)
    .join(divider);
}

export default setsOf;
