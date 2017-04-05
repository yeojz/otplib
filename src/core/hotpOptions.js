/**
 * Generates options for HOTP
 *
 * @module core/hotpOptions
 * @param {object} options - key-values to override
 * @return {object}
 */
function hotpOptions(options = {}) {
  return {
    digits: 6,
    ...options
  }
}

export default hotpOptions;
