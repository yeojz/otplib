import totpCheck from './totpCheck';

/**
 * Checks the provided OTP token against system generated token
 * with support for checking previous x time-step windows
 *
 * @module otplib-core/totpCheckWithWindow
 * @param {string} token - the OTP token to check
 * @param {string} secret - your secret that is used to generate the token
 * @param {object} options - options which was used to generate it originally
 * @return {boolean}
 */
function totpCheckWithWindow(token, secret, options) {
  let opt = Object.assign({}, options);

  if (typeof opt.window !== 'number') {
    throw new Error('Expecting options.window to be a number');
  }

  const decrement = opt.step * 1000;

  for (let i = 0; i <= opt.window; i++) {
    opt.epoch = opt.epoch - (i * decrement);

    if (totpCheck(token, secret, opt)) {
      return true;
    }
  }

  return false;
}

export default totpCheckWithWindow;
