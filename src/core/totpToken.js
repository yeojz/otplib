import hotpToken from './hotpToken';
import totpOptions from './totpOptions';

/**
 * Generates the OTP code
 *
 * @module core/totpToken
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - additional token settings. eg: epoch, steps, digits
 * @return {number} OTP Code
 */
function totpToken(secret, options = {}) {
  const opt = totpOptions(options);
  const timeCounter = Math.floor(opt.epoch / (opt.step * 1000.0));
  return hotpToken(secret, timeCounter, opt.digits);
}

export default totpToken;
