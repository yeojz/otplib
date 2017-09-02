import hotpToken from './hotpToken';
import totpCounter from './totpCounter';
import totpOptions from './totpOptions';

/**
 * Generates the OTP code
 *
 * @module otplib-core/totpToken
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - allowed options as specified in totpOptions()
 * @return {string} OTP Code
 */
function totpToken(secret, options = {}) {
  const opt = totpOptions(options);
  const counter = totpCounter(opt.epoch, opt.step);
  return hotpToken(secret, counter, opt);
}

export default totpToken;
