import totpCheck from './totpCheck';

/**
 * Checks the provided OTP token against system generated token
 * with support for checking previous x time-step windows
 *
 * @module otplib-core/totpCheckWithWindow
 * @param {string} token - the OTP token to check
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - options which was used to generate it originally
 * @return {integer} - the number of windows back it was successful. -1 otherwise
 */
function totpCheckWithWindow(token, secret, options) {
  let opt = Object.assign({}, options);

  if (typeof opt.window !== 'number') {
    throw new Error('Expecting options.window to be a number');
  }

  const decrement = opt.step * 1000;
  const epoch = opt.epoch;

  for (let i = 0; i <= opt.window; i++) {
    opt.epoch = epoch - i * decrement;

    if (totpCheck(token, secret, opt)) {
      return i;
    }
  }

  return -1;
}

export default totpCheckWithWindow;
