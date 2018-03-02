import hotpToken from './hotpToken';
import totpCounter from './totpCounter';

/**
 * Generates the OTP code
 *
 * @module otplib-core/totpToken
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - allowed options as specified in totpOptions()
 * @return {string} OTP Code
 */
function totpToken(secret, options) {
  if (typeof options.epoch !== 'number') {
    throw new Error('Expecting options.epoch to be a number');
  }

  if (typeof options.step !== 'number') {
    throw new Error('Expecting options.step to be a number');
  }

  const counter = totpCounter(options.epoch, options.step);
  return hotpToken(secret, counter, options);
}

export default totpToken;
