import hotpToken from './hotpToken';

/**
 * Generates the OTP code
 *
 * @method totpToken
 *
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - additional token settings. eg: epoch, steps, tokenLength
 * @return {number} OTP Code
 */
function totpToken(secret, options = {}) {
  const opt = {
    epoch: new Date().getTime(),
    step: 30,
    tokenLength: 6,
    ...options
  }

  const timeCounter = Math.floor(opt.epoch / (opt.step * 1000.0));
  return hotpToken(secret, timeCounter, opt.tokenLength);
}

export default totpToken;
