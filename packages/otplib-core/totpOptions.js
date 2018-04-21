import hotpOptions from './hotpOptions';
import totpSecret from './totpSecret';

const defaultOptions = {
  createHmacSecret: totpSecret,
  epoch: null,
  step: 30,
  window: 0
};

/**
 * Generates options for TOTP
 *
 * @module otplib-core/totpOptions
 * @param {number} options.digits - the output token length
 * @param {string} options.epoch - starting time since the UNIX epoch (seconds)
 * @param {number} options.step - time step (seconds)
 * @param {number|array} options.window - acceptable window where codes a valid.
 * @return {object}
 */
function totpOptions(options = {}) {
  let opt = Object.assign(hotpOptions(), defaultOptions, options);
  opt.epoch = typeof opt.epoch === 'number' ? opt.epoch * 1000 : Date.now();

  return opt;
}

export default totpOptions;
