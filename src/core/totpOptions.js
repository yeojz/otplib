/**
 * Generates options for TOTP
 *
 * @module core/totpOptions
 * @param {object} options - key-values to override
 * @return {object}
 */
function totpOptions(options = {}) {
  let opt = {
    epoch: null,
    step: 30,
    digits: 6,
    ...options
  }

  opt.epoch = typeof opt.epoch === 'number'
    ? opt.epoch
    : new Date().getTime();

  return opt;
}

export default totpOptions;
