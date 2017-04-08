import hotpToken from './hotpToken';
import totpOptions from './totpOptions';

function floor(value) {
  return Math.floor(value);
}

/**
 * Generates the OTP code
 *
 * @module core/totpToken
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - allowed options as specified in totpOptions()
 * @return {string} OTP Code
 */
function totpToken(secret, options = {}) {
  const opt = totpOptions(options);
  const timeCounter = floor(opt.epoch / (opt.step * 1000.0));
  return hotpToken(secret, timeCounter, opt.digits);
}

export default totpToken;
