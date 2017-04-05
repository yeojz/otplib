/**
 * Removes all spaces
 *
 * @method removeSpaces
 *
 * @param {string} value - string to parse
 * @return {string}
 */
function removeSpaces(value = '') {
  return value.replace(/\s+/g, '');
}

export default removeSpaces;
