/**
 * Removes all spaces
 *
 * @method removeSpaces
 *
 * @param {string} value - string to parse
 * @return {string}
 */
function removeSpaces(value = '') {
  if (value == null) {
    return '';
  }
  return value.replace(/\s+/g, '');
}

export default removeSpaces;
