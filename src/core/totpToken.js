import hotpToken from './hotpToken';

/**
 * Generates the OTP code
 *
 * @method totpToken
 *
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - additional token settings. eg: epoch, steps, digits
 * @return {number} OTP Code
 */
function totpToken(secret, options = {}) {
  const opt = {
    epoch: null,
    step: 30,
    digits: 6,
    ...options,
  }
  const epoch = opt.epoch == null ? new Date().getTime() : opt.epoch;
  const timeCounter = Math.floor(epoch / (opt.step * 1000.0));
  return hotpToken(secret, timeCounter, opt.digits);
}

export default totpToken;
